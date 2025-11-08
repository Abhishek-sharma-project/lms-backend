import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  createCheckoutSession,
  getAllPurchasedCourse,
  getCourseDetailsWithPurchaseStatus,
  getPurchaseDetails,
  webhook,
} from "../controllers/coursePurchase.controller.js";

const router = express.Router();

router.route("/create-checkout").post(isAuthenticated, createCheckoutSession);
router.route("/webhook").post(isAuthenticated, webhook);
router.route("/course/:transactionId").get(isAuthenticated, getPurchaseDetails);
router
  .route("/course/:courseId/detail-with-status")
  .get(isAuthenticated, getCourseDetailsWithPurchaseStatus);
router.route("/").get(isAuthenticated, getAllPurchasedCourse);

export default router;
