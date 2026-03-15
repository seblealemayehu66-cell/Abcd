import express from "express";

import {
placeOrder,
getCustomerOrders,
getSellerOrders,
getInvoice,
pickOrder
} from "../controllers/order.controller.js";

import authMiddleware from "../middleware/authMiddleware.js";
import { sellerAuth } from "../middleware/sellerAuth.js";

const router = express.Router();

router.post("/place",placeOrder);

router.get("/customer/orders",authMiddleware,getCustomerOrders);


router.get("/invoice/:id",authMiddleware,getInvoice);

router.get("/seller/orders", sellerAuth, getSellerOrders);
router.post("/pick/:id", sellerAuth, pickOrder); 

export default router;
