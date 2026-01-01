import userModel from "../models/userModel.js"

// --- ADD TO CART ---
const addToCart = async (req, res) => {
    try {
        let userData = await userModel.findById(req.body.userId);
        // SAFETY CHECK: Stop if user is missing
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        let cartData = await userData.cartData || {};
        
        if (!cartData[req.body.itemId]) {
            cartData[req.body.itemId] = 1;
        } else {
            cartData[req.body.itemId] += 1;
        }
        
        await userModel.findByIdAndUpdate(req.body.userId, { cartData });
        res.json({ success: true, message: "Added To Cart" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// --- REMOVE FROM CART ---
const removeFromCart = async (req, res) => {
    try {
        let userData = await userModel.findById(req.body.userId);
        // SAFETY CHECK
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        let cartData = await userData.cartData || {};
        
        if (cartData[req.body.itemId] > 0) {
            cartData[req.body.itemId] -= 1;
        }
        
        await userModel.findByIdAndUpdate(req.body.userId, { cartData });
        res.json({ success: true, message: "Removed From Cart" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// --- GET CART ---
const getCart = async (req, res) => {
    try {
        let userData = await userModel.findById(req.body.userId);
        // SAFETY CHECK (This was causing your specific crash)
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        let cartData = await userData.cartData || {};
        res.json({ success: true, cartData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

// --- CLEAR CART ---
const clearCart = async (req, res) => {
    try {
        let userData = await userModel.findById(req.body.userId);
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }
        await userModel.findByIdAndUpdate(req.body.userId, { cartData: {} });
        res.json({ success: true, message: "Cart Cleared" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" })
    }
}

export { addToCart, removeFromCart, getCart, clearCart }