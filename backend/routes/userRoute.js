import express from "express";
import { 
    loginUser, registerUser,
    sendEmailOtp, sendResetOtp, resetPassword, 
    getAddress, saveAddress, updateAddress, removeAddress 
} from "../controllers/userController.js";
import authMiddleware from "../middleware/auth.js";

const userRouter = express.Router();

userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/send-otp", sendEmailOtp);
userRouter.post("/send-reset-otp", sendResetOtp);
userRouter.post("/reset-password", resetPassword);

userRouter.get("/get-address", authMiddleware, getAddress);
userRouter.post("/save-address", authMiddleware, saveAddress);
userRouter.post("/update-address", authMiddleware, updateAddress);
userRouter.post("/remove-address", authMiddleware, removeAddress);

export default userRouter;