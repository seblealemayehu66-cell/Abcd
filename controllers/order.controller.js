import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";

/* ADMIN creates order using virtual buyer */

export const placeOrder = async (req,res)=>{
try{

const {buyerId,customerId,productId}=req.body;

const buyer = await User.findById(buyerId);
if(!buyer || !buyer.isVirtualBuyer)
return res.status(400).json({message:"Invalid virtual buyer"});

const customer = await User.findById(customerId);
if(!customer)
return res.status(400).json({message:"Customer not found"});

const product = await Product.findById(productId);
if(!product)
return res.status(400).json({message:"Product not found"});

/* company cost */

const buyPrice = product.price * 0.8;

const order = new Order({
buyerId,
customerId,
productId,
price:product.price,
buyPrice
});

await order.save();

res.json({
message:"Order placed successfully",
order
});

}catch(err){
console.log(err);
res.status(500).json({message:"Server error"});
}
};


/* CUSTOMER sees orders */

export const getCustomerOrders = async (req,res)=>{
try{

const orders = await Order.find({customerId:req.user.id})
.populate("productId")
.populate("buyerId","name email")
.populate("customerId","name email");

res.json(orders);

}catch(err){
console.log(err);
res.status(500).json({message:"Server error"});
}
};


/* SELLER sees orders */

export const getSellerOrders = async (req,res)=>{
try{

const orders = await Order.find()
.populate("productId")
.populate("customerId","name email")
.populate("buyerId","name email");

res.json(orders);

}catch(err){
console.log(err);
res.status(500).json({message:"Server error"});
}
};


/* GET INVOICE */

export const getInvoice = async (req,res)=>{
try{

const order = await Order.findById(req.params.id)
.populate("productId")
.populate("customerId","name email");

if(!order)
return res.status(404).json({message:"Order not found"});

res.json({
orderId:order._id,
product:order.productId.name,
image:order.productId.image,
customer:order.customerId,
sellPrice:order.price,
buyPrice:order.buyPrice,
profit:order.price - order.buyPrice
});

}catch(err){
console.log(err);
res.status(500).json({message:"Server error"});
}
};


/* PICK ORDER + WALLET DEDUCTION */

export const pickOrder = async (req,res)=>{
try{

const order = await Order.findById(req.params.id);

if(!order)
return res.status(404).json({message:"Order not found"});

if(order.status !== "pending")
return res.status(400).json({message:"Order already processed"});

const seller = await User.findById(req.user.id);

if(seller.wallet < order.buyPrice)
return res.status(400).json({message:"Insufficient wallet balance"});

/* deduct wallet */

seller.wallet -= order.buyPrice;
await seller.save();

/* update order */

order.status = "delivery";
await order.save();

res.json({
message:"Order picked successfully",
order
});

}catch(err){
console.log(err);
res.status(500).json({message:"Server error"});
}
};
