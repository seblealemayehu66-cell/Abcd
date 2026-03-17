import Order from "../models/Order.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import SellerProduct from "../models/SellerProduct.js";


/* =========================
   ✅ PLACE ORDER (ADMIN)
========================= */
export const placeOrder = async (req,res)=>{
try{

const {buyerId,customerId,productId,quantity} = req.body;

const buyer = await User.findById(buyerId);
if(!buyer || !buyer.isVirtualBuyer)
return res.status(400).json({message:"Invalid virtual buyer"});

const customer = await User.findById(customerId);
if(!customer)
return res.status(400).json({message:"Customer not found"});

const product = await Product.findById(productId);
if(!product)
return res.status(400).json({message:"Product not found"});

// ✅ quantity
const qty = quantity || 1;

// ❌ prevent ordering more than stock
if(product.stock < qty){
return res.status(400).json({message:"Not enough product stock"});
}

// 💰 company cost
const buyPrice = product.price * 0.8;

const order = new Order({
buyerId,
customerId,
productId,
price: product.price * qty,
buyPrice: buyPrice * qty,
quantity: qty
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



/* =========================
   ✅ CUSTOMER ORDERS
========================= */
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



/* =========================
   ✅ SELLER ORDERS
========================= */
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



/* =========================
   ✅ GET INVOICE
========================= */
export const getInvoice = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("productId")
      .populate("customerId", "name email");

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json({
      orderId: order._id,
      product: order.productId?.name || "Product removed",
      image: order.productId?.image || "",
      customer: order.customerId || {},
      sellPrice: order.price || 0,
      buyPrice: order.buyPrice || 0,
      profit: (order.price || 0) - (order.buyPrice || 0)
    });

  } catch (err) {
    console.log("Get Invoice Error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
/* =========================
   🔥 PICK ORDER (MAIN LOGIC)
========================= */
export const pickOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId)
      .populate("productId")
      .populate("customerId")
      .populate("buyerId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "pending") {
      return res.status(400).json({ message: "Order already processed" });
    }

    const seller = req.seller;
    if (!seller) {
      return res.status(401).json({ message: "Seller not authenticated" });
    }

    // 🔥 GET SELLER PRODUCT
    const sellerProduct = await SellerProduct.findOne({
      sellerId: seller._id,
      productId: order.productId._id
    });

    if (!sellerProduct) {
      return res.status(404).json({ message: "Seller product not found" });
    }

    // ❌ STOCK CHECK
    if (sellerProduct.stock < order.quantity) {
      return res.status(400).json({ message: "Not enough seller stock" });
    }

    if (order.productId.stock < order.quantity) {
      return res.status(400).json({ message: "Not enough global stock" });
    }

    // 💰 WALLET CHECK
    if (seller.wallet.balance < order.buyPrice) {
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    // =========================
    // ✅ DEDUCT STOCK
    // =========================
    sellerProduct.stock -= order.quantity;
    await sellerProduct.save();

    const product = await Product.findById(order.productId._id);
    product.stock -= order.quantity;
    await product.save();

    // =========================
    // 💰 DEDUCT WALLET (BUY COST)
    // =========================
    seller.wallet.balance -= order.buyPrice;

    seller.wallet.transactions.push({
      type: "debit",
      amount: order.buyPrice,
      note: `Order pickup - ${order.productId.name}`
    });

    await seller.save();

    // =========================
    // 🔒 FREEZE CUSTOMER MONEY
    // =========================
    order.frozenAmount = order.price;

    // =========================
    // 🚚 UPDATE STATUS
    // =========================
    order.status = "delivery";

    await order.save();

    res.json({
      message: "Order picked successfully. Stock deducted, wallet updated, delivery started."
    });

  } catch (err) {
    console.error("Pick Order Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};



/* =========================
   🚚 CONFIRM DELIVERY
========================= */
export const confirmDelivery = async (req, res) => {
  try {
    const orderId = req.params.id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "delivery") {
      return res.status(400).json({ message: "Order not in delivery stage" });
    }

    // 💰 PROFIT RELEASE
    const seller = await User.findById(order.sellerId);

    const profit = order.price - order.buyPrice;

    seller.wallet.balance += order.price;

    seller.wallet.transactions.push({
      type: "credit",
      amount: order.price,
      note: "Order delivered profit"
    });

    await seller.save();

    // ✅ UPDATE STATUS
    order.status = "delivered";

    await order.save();

    res.json({
      message: "Order delivered successfully. Profit added to wallet."
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};
