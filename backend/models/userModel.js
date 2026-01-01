import mongoose from "mongoose"

// 1. KEEPING YOUR ADDRESS SCHEMA EXACTLY AS IT WAS
const addressSchema = new mongoose.Schema({
    firstName: {type:String, required:true},
    lastName: {type:String, required:true},
    email: {type:String, required:true},
    street: {type:String, required:true},
    city: {type:String, required:true},
    state: {type:String, required:true},
    zipcode: {type:String, required:true},
    country: {type:String, required:true},
    phone: {type:String, required:true}
});

const userSchema = new mongoose.Schema({
    name: { type: String, default: "User" }, // Default name for phone users
    
    // 2. MODIFIED: Removed 'required:true', Added 'sparse:true' (Allows nulls)
    email: { type: String, unique: true, sparse: true }, 
    password: { type: String }, 
    
    // 3. NEW: Phone field
    phone: { type: String, unique: true, sparse: true },

    cartData: { type: Object, default: {} },
    address: { type: [addressSchema], default: [] } 
}, { minimize: false })

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;