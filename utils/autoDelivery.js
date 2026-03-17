import Order from "../models/Order.js";
import User from "../models/User.js";

export const startAutoDelivery = () => {
  setInterval(async () => {
    try {
      const now = new Date();

      const orders = await Order.find({
        status: "delivery",
        deliveryDate: { $lte: now },
        isPaid: false
      });

      for (let order of orders) {
        const seller = await User.findById(order.sellerId);
        if (!seller) continue;

        seller.wallet.balance += order.price;

        seller.wallet.transactions.push({
          type: "credit",
          amount: order.price,
          note: "Auto delivery profit"
        });

        await seller.save();

        order.status = "completed";
        order.isPaid = true;

        await order.save();
      }

    } catch (err) {
      console.error("Auto Delivery Error:", err);
    }
  }, 60000); // every 1 minute
};
