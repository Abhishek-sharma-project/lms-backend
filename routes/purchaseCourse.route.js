import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createCheckoutSession,
  getPaymentStatus,
  webhook,
} from "../controllers/coursePurchase.controller.js";

const router = express.Router();

router.route("/create-checkout").post(isAuthenticated, createCheckoutSession);
router.route("/webhook").post(isAuthenticated, webhook);
router.route("/course/:transactionId", getPaymentStatus);

export default router;
