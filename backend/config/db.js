import mongoose from "mongoose";

export const connectDB = async () => {
    // 🔒 SECURE: Uses environment variable now
    await mongoose.connect(process.env.DB_URI)
    .then(()=>console.log("DB Connected"));
}