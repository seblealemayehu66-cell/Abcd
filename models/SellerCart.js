import mongoose from "mongoose";

const sellerCartSchema = new mongoose.Schema(
{
  sellerId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
  },
  productId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Product"
  },
  price:Number,
  stock:Number,
  quantity:{
    type:Number,
    default:1
  }
},{timestamps:true}
);

export default mongoose.model("SellerCart",sellerCartSchema);
