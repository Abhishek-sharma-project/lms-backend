import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";

export const createCheckoutSession = async (req, res) => {
  try {
    const userId = req.id;
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    // Payment Id
    const transactionId = "TXN_" + new mongoose.Types.ObjectId().toString();

    // create course order
    await CoursePurchase.create({
      courseId,
      userId,
      amount: course.coursePrice,
      status: "pending",
      paymentId: transactionId,
    });

    return res.status(200).json({
      success: true,
      message: "Checkout session created",
      order: {
        transactionId,
        amount: course.coursePrice,
        courseTitle: course.courseTitle,
        currency: "INR",
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to purchase course",
    });
  }
};

// Webhook
export const webhook = async (req, res) => {
  try {
    const { transactionId } = req.body;
    setTimeout(async () => {
      try {
        const payment = await CoursePurchase.findOne({
          paymentId: transactionId,
          status: "pending",
        });

        if (!payment) {
          return res.status(404).json({
            success: false,
            message: "Payment already processed",
          });
        }

        const status = Math.random() > 0.1 ? "completed" : "failed";

        // update payment status
        payment.status = status;
        await payment.save();

        res.status(200).json({
          success: true,
          message: "Payment verified",
          status: payment.status,
        });
      } catch (error) {
        console.log(error);
        return res.status(500).json({
          message: "Failed to complete payment",
        });
      }
    }, 3000);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to update payment",
    });
  }
};

// Check payment status

export const getPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const purchase = await CoursePurchase.findOne({ paymentId: transactionId });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Payment not found ",
      });
    }

    return res.status(200).json({
      success: true,
      amount: purchase.amount,
      status: purchase.status,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to get payment",
    });
  }
};
