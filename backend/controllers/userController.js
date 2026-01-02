import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import axios from "axios"; // Ensure axios is installed

// Token Generator
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET);
}

let otpStore = {}; 

// 👇 EMAILJS CONFIGURATION (Uses the variables you added to Render)
const EMAILJS_SERVICE_ID = process.env.EMAILJS_SERVICE_ID; // Your "service_xyz"
const EMAILJS_TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const EMAILJS_PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;

// 👇 Helper: Send Email via EmailJS API (Bypasses SMTP blocks)
const sendEmailJS = async (email, otp) => {
    try {
        const data = {
            service_id: EMAILJS_SERVICE_ID,
            template_id: EMAILJS_TEMPLATE_ID,
            user_id: EMAILJS_PUBLIC_KEY,
            accessToken: EMAILJS_PRIVATE_KEY,
            template_params: {
                to_email: email,  // Matches {{to_email}} in your template
                otp: otp          // Matches {{otp}} in your template
            }
        };

        await axios.post('https://api.emailjs.com/api/v1.0/email/send', data);
        console.log("✅ Email sent successfully via EmailJS");
        return true;
    } catch (error) {
        console.log("❌ EmailJS Failed:", error.response ? error.response.data : error.message);
        return false;
    }
};

// --- 1. SEND OTP ---
const sendEmailOtp = async (req, res) => {
    const { email } = req.body;
    try {
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "Email already registered" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        otpStore[email] = otp; 

        // Send via EmailJS
        const sent = await sendEmailJS(email, otp);

        if (sent) {
            res.json({ success: true, message: "OTP Sent to Email" });
        } else {
            res.json({ success: false, message: "Failed to send email. Check logs." });
        }

    } catch (error) { 
        console.log(error);
        res.json({ success: false, message: "Error" }); 
    }
}

// --- 2. SEND RESET OTP ---
const sendResetOtp = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        otpStore[email] = otp; 

        const sent = await sendEmailJS(email, otp);

        if (sent) {
            res.json({ success: true, message: "OTP Sent to Email" });
        } else {
            res.json({ success: false, message: "Failed to send email" });
        }

    } catch (error) { res.json({ success: false, message: "Error" }); }
}

// --- 3. RESET PASSWORD ---
const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        if (!otpStore[email] || Number(otpStore[email]) !== Number(otp)) {
            return res.json({ success: false, message: "Invalid OTP" });
        }
        if (newPassword.length < 8) return res.json({ success: false, message: "Password too short" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await userModel.findOneAndUpdate({ email }, { password: hashedPassword });
        delete otpStore[email];

        res.json({ success: true, message: "Password Updated" });
    } catch (error) { res.json({ success: false, message: "Error" }); }
}

// --- 4. REGISTER ---
const registerUser = async (req, res) => {
    const { name, password, email, otp } = req.body;
    try {
        if (!otpStore[email] || Number(otpStore[email]) !== Number(otp)) {
            return res.json({ success: false, message: "Invalid OTP" });
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({ name, email, password: hashedPassword });
        const user = await newUser.save();
        delete otpStore[email];
        
        const token = createToken(user._id);
        res.json({ success: true, token });
    } catch (error) { res.json({ success: false, message: "Error" }); }
}

// --- 5. LOGIN ---
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user) return res.json({ success: false, message: "User Doesn't exists" });
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.json({ success: false, message: "Invalid Credentials" });
        
        const token = createToken(user._id);
        res.json({ success: true, token });
    } catch (error) { res.json({ success: false, message: "Error" }); }
}

// Address Functions
const getAddress = async (req, res) => {
    try {
        let userData = await userModel.findById(req.body.userId);
        if (!userData) return res.json({ success: false, message: "User not found" });
        res.json({ success: true, address: userData.address }); 
    } catch (error) { res.json({ success: false, message: "Error" }); }
}

const saveAddress = async (req, res) => {
    try {
        let userData = await userModel.findById(req.body.userId);
        if (!userData) return res.json({ success: false, message: "User not found" });
        let newAddress = req.body.address;
        await userModel.findByIdAndUpdate(req.body.userId, { $push: { address: newAddress } });
        res.json({ success: true, message: "Address Saved" });
    } catch (error) { res.json({ success: false, message: "Error" }); }
}

const updateAddress = async (req, res) => {
    try {
        const { userId, addressIndex, address } = req.body;
        const user = await userModel.findById(userId);
        if (user && user.address && user.address[addressIndex]) {
            user.address[addressIndex] = address;
            await user.save();
            res.json({ success: true, message: "Address Updated" });
        } else { res.json({ success: false, message: "Address not found" }); }
    } catch (error) { res.json({ success: false, message: "Error" }); }
}

const removeAddress = async (req, res) => {
    try {
        const { userId, id } = req.body;
        await userModel.findByIdAndUpdate(userId, { $pull: { address: { _id: id } } });
        res.json({ success: true, message: "Address Deleted" });
    } catch (error) { res.json({ success: false, message: "Error" }); }
}

export { 
    loginUser, 
    registerUser, 
    sendEmailOtp, 
    sendResetOtp, 
    resetPassword, 
    getAddress, 
    saveAddress, 
    updateAddress, 
    removeAddress 
}