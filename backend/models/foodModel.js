import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
    name: {type:String,required:true},
    description:{type:String,required:true},
    price:{type:Number,required:true}, // Ensure this is Number, not String
    image:{type:String,required:true},
    category:{type:String,required:true}
}, { minimize: false, timestamps: true }) // <--- ADD THIS LINE (timestamps: true)

const foodModel = mongoose.models.food || mongoose.model("food",foodSchema)

export default foodModel;