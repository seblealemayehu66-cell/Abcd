import express from "express";

import {
placeOrder,
getCustomerOrders,
getSellerOrders,
getInvoice,
pickOrder
} from "../controllers/orderController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/place",placeOrder);

router.get("/customer/orders",authMiddleware,getCustomerOrders);

router.get("/seller/orders",authMiddleware,getSellerOrders);

router.get("/invoice/:id",authMiddleware,getInvoice);

router.post("/pick/:id",authMiddleware,pickOrder);

export default router;
