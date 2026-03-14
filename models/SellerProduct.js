import mongoose from "mongoose";

const sellerProductSchema = new mongoose.Schema({
  sellerId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"User"
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

export default mongoose.model("SellerProduct",sellerProductSchema);
