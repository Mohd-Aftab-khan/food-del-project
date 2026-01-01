import React, { useState, useContext, useEffect, useRef } from 'react';
import './Chatbot.css';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Chatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { 
            text: "Hello! I'm your AI Food Assistant. Try saying 'Order 3 Rolle'!", 
            sender: 'bot' 
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    // --- SESSION STATE ---
    const [currentSessionItems, setCurrentSessionItems] = useState([]);

    // Import setCartItemQuantity (we use this for EVERYTHING now to be precise)
    const { food_list, url, setCartItemQuantity, clearCart } = useContext(StoreContext); 
    const navigate = useNavigate();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const getEditDistance = (a, b) => { if(a.length === 0) return b.length; if(b.length === 0) return a.length; const matrix = []; for(let i = 0; i <= b.length; i++) { matrix[i] = [i]; } for(let j = 0; j <= a.length; j++) { matrix[0][j] = j; } for(let i = 1; i <= b.length; i++){ for(let j = 1; j <= a.length; j++){ if(b.charAt(i-1) === a.charAt(j-1)){ matrix[i][j] = matrix[i-1][j-1]; } else { matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1)); } } } return matrix[b.length][a.length]; };
    const findBestMatch = (aiItemName) => { if (!food_list || food_list.length === 0) return null; let bestMatch = null; let lowestDist = 999; const lowerAi = aiItemName.toLowerCase().trim(); food_list.forEach(dbItem => { const lowerDb = dbItem.name.toLowerCase(); if (lowerDb === lowerAi || lowerDb.includes(lowerAi) || lowerAi.includes(lowerDb)) { bestMatch = dbItem; lowestDist = 0; return; } const dist = getEditDistance(lowerAi, lowerDb); if (dist < lowestDist && dist < 4) { lowestDist = dist; bestMatch = dbItem; } }); return bestMatch; };

    const executeOrderCommands = async (aiResponse, isAddCommand) => {
        const startTag = "***ORDERS_START***";
        const endTag = "***ORDERS_END***";
        
        const startIndex = aiResponse.indexOf(startTag);
        const endIndex = aiResponse.indexOf(endTag);

        if (startIndex === -1 || endIndex === -1) {
            return aiResponse; 
        }

        const userVisibleText = aiResponse.substring(0, startIndex).trim();
        const orderBlock = aiResponse.substring(startIndex + startTag.length, endIndex).trim();
        const orderLines = orderBlock.split("\n");

        // --- 1. RESET LOGIC ---
        // If not adding, we assume a fresh start for the AI context.
        if (!isAddCommand) {
            // Optional: You can uncomment clearCart() if you want to wipe manual items on fresh order
            // await clearCart(); 
            setCurrentSessionItems([]); 
        }

        // Initialize active items
        // We use a deep copy logic to ensure we don't mutate state directly before setting
        let activeItems = isAddCommand ? currentSessionItems.map(item => ({...item})) : [];

        for (let line of orderLines) {
            if (!line.includes(";")) continue;

            const [rawName, rawQty] = line.split(";");
            const requestedQty = parseInt(rawQty);
            const targetItem = findBestMatch(rawName);

            if (targetItem && requestedQty > 0) {
                
                let newTotalQty = requestedQty;

                if (isAddCommand) {
                    // --- SCENARIO: ADD ---
                    // 1. Check if we already have this in our AI Session
                    const existingItemIndex = activeItems.findIndex(i => i._id === targetItem._id);
                    
                    if (existingItemIndex > -1) {
                        // Accumulate quantity
                        newTotalQty = activeItems[existingItemIndex].quantity + requestedQty;
                        activeItems[existingItemIndex].quantity = newTotalQty;
                    } else {
                        // New item for this session
                        activeItems.push({ ...targetItem, quantity: requestedQty });
                    }
                } else {
                    // --- SCENARIO: FRESH ORDER ---
                    // Just push the new item (we cleared the list above)
                    activeItems.push({ ...targetItem, quantity: requestedQty });
                }

                // --- CRITICAL FIX: UPDATE CART TO EXACT NUMBER ---
                // Instead of "Adding", we tell the DB: "This is the new total quantity."
                // This prevents double counting against manual items.
                console.log(`Updating ${targetItem.name} to exact quantity: ${newTotalQty}`);
                await setCartItemQuantity(targetItem._id, newTotalQty);
            }
        }

        // Update Session State
        setCurrentSessionItems(activeItems);

        if (activeItems.length > 0) {
            setTimeout(() => {
                navigate('/order', { state: { fromChatbot: true, items: activeItems } });
                setIsOpen(false);
            }, 2500);
            
            return userVisibleText + `\n\n(Cart updated & proceeding to checkout...)`;
        }

        return userVisibleText;
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMessage = input;
        setInput(""); 
        setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
        setIsLoading(true);

        const lowerInput = userMessage.toLowerCase();

        if ((lowerInput.includes("clear") || lowerInput.includes("remove") || lowerInput.includes("delete") || lowerInput.includes("empty")) && lowerInput.includes("cart")) {
            
            await clearCart(); // Calls the function from StoreContext
            
            setMessages(prev => [...prev, { text: "Done! Your cart has been cleared.", sender: 'bot' }]);
            setIsLoading(false);
            return; // 🛑 Stop here! Don't send this to the AI API.
        }
        
        // Check Keywords
        const isAddCommand = lowerInput.includes("add") || lowerInput.includes("extra") || lowerInput.includes("plus") || lowerInput.includes("more");
        
        // Prevent AI from seeing old history so it doesn't repeat old items
        const historyToSend = []; 

        try {
            const response = await axios.post(url + "/api/chat", {
                userMessage: userMessage,
                history: historyToSend 
            });

            if (response.data.success) {
                const aiRawText = response.data.message;
                const finalUserText = await executeOrderCommands(aiRawText, isAddCommand);
                setMessages(prev => [...prev, { text: finalUserText, sender: 'bot' }]);
            } else {
                setMessages(prev => [...prev, { text: "Brain offline.", sender: 'bot' }]);
            }

        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { text: "Connection Error.", sender: 'bot' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chatbot-container">
            {!isOpen && (
                <button className="chatbot-toggle" onClick={() => setIsOpen(true)}>💬</button>
            )}
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <span>AI Assistant</span>
                        <button onClick={() => setIsOpen(false)}>✖</button>
                    </div>
                    
                    <div className="chat-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender === 'bot' ? 'bot-message' : 'user-message'}`}>
                                {msg.text}
                            </div>
                        ))}
                        {isLoading && <div className="message bot-message">Thinking...</div>}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <input 
                            type="text" value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()} 
                            placeholder="Ask me anything..." 
                        />
                        <button className="send-btn" onClick={() => handleSend()}>➤</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chatbot;