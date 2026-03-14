import mongoose from "mongoose";
import express from "express";
import cors from "cors";




import productRoutes from "./routes/product.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";

import sellerRoutes from "./routes/seller.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import virtualBuyerRoutes from "./routes/virtualBuyer.routes.js";
import supportRoutes from "./routes/support.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";


import adminSupportRoutes from "./routes/support.admin.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import sellerCartRoutes from "./routes/sellerCart.routes.js";
import sellerProductRoutes from "./routes/sellerProduct.routes.js";




// Admin seller management










const app = express();


app.use(cors());
app.use(express.json());




// Routes


app.use("/api/auth", authRoutes);

app.use("/api/products", productRoutes);
app.use("/api/seller-cart", sellerCartRoutes);
app.use("/api/seller-store", sellerProductRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/user",userRoutes);
app.use("/api/seller",sellerRoutes);
app.use("/uploads", express.static("uploads"));

app.use("/api/admin", adminRoutes);  
app.use("/api/adminn", virtualBuyerRoutes);  
app.use("/api/admin/support", adminSupportRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/wallet", walletRoutes); 









app.use("/api/customer", customerRoutes);



app.get("/", (req, res) => res.send("Backend is running 🚀"));

// ===== 404 HANDLER =====
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// ===== DATABASE CONNECTION =====




// ===== DATABASE CONNECTION =====


const DB = process.env.MONGO_URL; // Railway MongoDB

if (!DB) {
  console.error("❌ MONGO_URL is not defined in Railway variables");
  process.exit(1);
}

mongoose
  .connect(DB)
  .then(() => console.log("MongoDB Connected ✅ (Railway)"))
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// ===== START SERVER =====
const PORT = process.env.PORT || 8080;

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT} 🚀`)
);
