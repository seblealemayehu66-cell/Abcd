import express from "express";
import cors from "cors";
import connectDB from "./db.js";



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





// Admin seller management










const app = express();
connectDB();

app.use(cors());
app.use(express.json());




// Routes


app.use("/api/auth", authRoutes);

app.use("/api/products", productRoutes);
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



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));