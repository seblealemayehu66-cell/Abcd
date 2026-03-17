import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
{
buyerId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
customerId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
productId:{type:mongoose.Schema.Types.ObjectId,ref:"Product",required:true},

status:{
type:String,
enum:["pending","picked","delivery","completed"],
default:"pending"
},

quantity: { type: Number, required: true, default: 1 },
price:{type:Number,required:true}, // sell price
buyPrice:{type:Number,required:true} // company price
},
{timestamps:true}
);

export default mongoose.model("Order",orderSchema);
