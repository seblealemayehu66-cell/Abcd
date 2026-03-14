import express from "express";
import SellerCart from "../models/SellerCart.js";
import SellerProduct from "../models/SellerProduct.js";
import Product from "../models/Product.js";
const router = express.Router();

// Middleware: get sellerId from req.user (you can replace with localStorage ID for dev)
const getSellerId = (req,res,next)=>{
  req.user = {id:req.headers["x-seller-id"]}; // for dev testing
  next();
};

router.use(getSellerId);

// GET seller cart
router.get("/", async(req,res)=>{
  const cart = await SellerCart.find({sellerId:req.user.id}).populate("productId");
  res.json(cart);
});

// ADD to cart
router.post("/add", async(req,res)=>{
  const {productId} = req.body;
  const product = await Product.findById(productId);

  const existing = await SellerCart.findOne({sellerId:req.user.id, productId});
  if(existing){
    existing.quantity +=1;
    await existing.save();
    return res.json(existing);
  }

  const cartItem = new SellerCart({
    sellerId:req.user.id,
    productId,
    price:product.price,
    stock:product.stock
  });

  await cartItem.save();
  res.json(cartItem);
});

// REMOVE from cart
router.delete("/:id", async(req,res)=>{
  await SellerCart.findByIdAndDelete(req.params.id);
  res.json({message:"Removed"});
});

// PUBLISH cart to store
router.post("/publish", async(req,res)=>{
  const cartItems = await SellerCart.find({sellerId:req.user.id}).populate("productId");
  for(const item of cartItems){
    await SellerProduct.create({
      sellerId:req.user.id,
      productId:item.productId._id,
      price:item.price,
      stock:item.stock,
      quantity:item.quantity
    });
  }
  await SellerCart.deleteMany({sellerId:req.user.id});
  res.json({message:"Published to store"});
});

export default router;
