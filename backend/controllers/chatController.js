import axios from "axios";
import foodModel from "../models/foodModel.js";

const chatWithAI = async (req, res) => {
    try {
        const { userMessage, history } = req.body;

        // 1. Fetch Menu (Get Name and Price)
        const foods = await foodModel.find({});
        const menuContext = foods.map(item => `${item.name} (Rs.${item.price})`).join(", ");

        // 2. Build System Prompt (STRICT BLOCK FORMAT)
        const systemPrompt = `
        You are a smart waiter for "Food-del". 
        
        MENU: ${menuContext}

        CRITICAL RULE:
        If the user wants to buy/order items, you must:
        1. Reply with a friendly message confirming the order.
        2. AT THE END, output a strict data block starting with "***ORDERS_START***".
        3. Inside the block, list items in format: "ExactName;Quantity".
        4. Put each item on a NEW LINE.
        5. End the block with "***ORDERS_END***".

        EXAMPLE 1 (Multiple Items):
        User: "I want 3 rolls and 4 desert dryfruit"
        You: 
        Great choice! I'm adding those to your cart now.
        ***ORDERS_START***
        Rolls;3
        Desert Dryfruit;4
        ***ORDERS_END***

        EXAMPLE 2 (Single Item):
        User: "Order 1 cake"
        You: 
        Sure, one cake coming up!
        ***ORDERS_START***
        Cake;1
        ***ORDERS_END***

        Use the exact item names from the menu.
        `;

        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "meta-llama/llama-4-scout-17b-16e-instruct", 
                messages: [
                    { role: "system", content: systemPrompt },
                    ...(history || []).map(msg => ({
                        role: msg.sender === 'user' ? 'user' : 'assistant',
                        content: msg.text
                    })),
                    { role: "user", content: userMessage }
                ],
                temperature: 0.1, // Low temp for strict formatting
                max_tokens: 300
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const aiResponse = response.data.choices[0].message.content;
        res.json({ success: true, message: aiResponse });

    } catch (error) {
        console.error("Groq API Error:", error.message);
        res.json({ success: false, message: "Sorry, I am having trouble thinking right now." });
    }
}

export { chatWithAI };