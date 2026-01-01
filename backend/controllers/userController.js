import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import nodemailer from "nodemailer"; 

// Token Generator
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET);
}

let otpStore = {}; 

// Standard Brevo Config
const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com", 
    port: 587,
    secure: false, 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});

// --- 1. SEND OTP (WITH BACKDOOR) ---
const sendEmailOtp = async (req, res) => {
    const { email } = req.body;
    try {
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "Email already registered" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        otpStore[email] = otp; 

        // 🟢 BACKDOOR: Sending OTP in the response for debugging
        res.json({ success: true, message: "OTP Sent", debug_otp: otp });

        // Try sending email in background (doesn't matter if it fails now)
        const mailOptions = {
            from: process.env.EMAIL_USER, 
            to: email,
            subject: "Verify Account",
            text: `Your code is: ${otp}`
        };
        transporter.sendMail(mailOptions, (err, info) => {
            if(err) console.log("Email failed, but OTP sent to frontend:", err);
        });

    } catch (error) { res.json({ success: false, message: "Error" }); }
}

// --- 2. SEND RESET OTP (WITH BACKDOOR) ---
const sendResetOtp = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        otpStore[email] = otp; 

        // 🟢 BACKDOOR: Sending OTP in the response
        res.json({ success: true, message: "OTP Sent", debug_otp: otp });

        const mailOptions = {
            from: process.env.EMAIL_USER, 
            to: email,
            subject: "Reset Password",
            text: `Your code is: ${otp}`
        };
        transporter.sendMail(mailOptions, (err, info) => {});

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

// Address Functions (Keep same)
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