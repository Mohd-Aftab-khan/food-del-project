import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import nodemailer from "nodemailer"; 

const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET);
}

let otpStore = {}; 

// 👇 REPLACE WITH THIS CODE 👇
// 👇 REPLACE WITH THIS CODE 👇
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,            // <--- CHANGE THIS TO 587
    secure: false,        // <--- MUST BE FALSE (Uses STARTTLS)
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

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

        const mailOptions = {
            from: "Food Del App",
            to: email,
            subject: "Verify Account",
            text: `Your verification code is: ${otp}`
        };
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) return res.json({ success: false, message: "Email failed" });
            res.json({ success: true, message: "OTP Sent" });
        });
    } catch (error) { res.json({ success: false, message: "Error" }); }
}

// Find your sendResetOtp function and update the inside part:
const sendResetOtp = async (req, res) => {
    const { email } = req.body;
    try {
        console.log("1. Checking user for email:", email); // Log 1

        const user = await userModel.findOne({ email });
        if (!user) {
            console.log("2. User not found"); // Log 2
            return res.json({ success: false, message: "User not found" });
        }

        console.log("3. User found. Preparing email..."); // Log 3
        const otp = Math.floor(100000 + Math.random() * 900000);
        otpStore[email] = otp; 

        const mailOptions = {
            from: "Food Del App",
            to: email,
            subject: "Reset Password Code",
            text: `Your password reset code is: ${otp}`
        };

        console.log("4. Sending email now via Port 465..."); // Log 4

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("❌ EMAIL FAILED:", error); // Log Error
                return res.json({ success: false, message: "Email failed" });
            }
            console.log("✅ EMAIL SENT SUCCESS!", info.response); // Log Success
            res.json({ success: true, message: "OTP Sent" });
        });

    } catch (error) { 
        console.log("❌ CRITICAL ERROR:", error);
        res.json({ success: false, message: "Error" }); 
    }
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
        if (newAddress.phone.length !== 10 || isNaN(newAddress.phone)) {
            return res.json({ success: false, message: "Mobile number must be exactly 10 digits" });
        }

        const isDuplicate = userData.address.some(addr => 
            addr.firstName === newAddress.firstName &&
            addr.street === newAddress.street &&
            addr.city === newAddress.city &&
            addr.zipcode === newAddress.zipcode && 
            addr.phone === newAddress.phone
        );

        if (isDuplicate) {
            return res.json({ success: false, message: "Your address is already saved!" });
        }

        await userModel.findByIdAndUpdate(req.body.userId, { $push: { address: newAddress } });
        res.json({ success: true, message: "Address Saved" });

    } catch (error) { res.json({ success: false, message: "Error saving address" }); }
}

const updateAddress = async (req, res) => {
    try {
        const { userId, addressIndex, address } = req.body;
        const user = await userModel.findById(userId);
        if (!user) return res.json({ success: false, message: "User not found" });

        if (user.address && user.address[addressIndex]) {
            user.address[addressIndex] = address;
            await user.save();
            res.json({ success: true, message: "Address Updated" });
        } else { 
            res.json({ success: false, message: "Address not found" }); 
        }
    } catch (error) { res.json({ success: false, message: "Error" }); }
}

const removeAddress = async (req, res) => {
    try {
        const { userId, id } = req.body;
        await userModel.findByIdAndUpdate(userId, { $pull: { address: { _id: id } } });
        res.json({ success: true, message: "Address Deleted" });
    } catch (error) { res.json({ success: false, message: "Error" }); }
}

// 🧹 REMOVED: loginWithPhone
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