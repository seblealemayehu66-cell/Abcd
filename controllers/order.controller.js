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

export const pickOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Fetch order with product & customer details
    const order = await Order.findById(orderId)
      .populate("productId")
      .populate("customerId")
      .populate("buyerId"); // optional if needed

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order is already processed
    if (order.status !== "pending") {
      return res.status(400).json({ message: "Order already processed" });
    }

    const seller = req.seller; // from sellerAuth middleware
    if (!seller) {
      return res.status(401).json({ message: "Seller not authenticated" });
    }

    // Check seller wallet
    if (seller.wallet.balance < order.price) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    // Deduct wallet balance
    seller.wallet.balance -= order.price;

    // Record transaction
    seller.wallet.transactions.push({
      type: "debit",
      amount: order.price,
      note: `Order pickup - ${order.productId.name}`,
    });

    await seller.save();

    // Update order status
    order.status = "delivery";
    await order.save();

    // Return invoice
    const invoice = {
      orderId: order._id,
      product: {
        name: order.productId.name,
        sellPrice: order.price,
        originalPrice: order.productId.price,
      },
      customer: {
        name: order.customerId.name,
        email: order.customerId.email,
        address: order.customerId.address || "N/A",
      },
      sellerBalance: seller.wallet.balance,
    };

    res.json({
      message: "Order picked successfully",
      order,
      invoice,
    });

  } catch (err) {
    console.error("Pick Order Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
