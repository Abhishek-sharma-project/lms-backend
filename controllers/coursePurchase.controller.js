import mongoose from "mongoose";
import { Course } from "../models/course.model.js";
import { CoursePurchase } from "../models/coursePurchase.model.js";
import { Lecture } from "../models/lecture.model.js";
import { User } from "../models/user.model.js";

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

    if (course?.creator?.toString() === userId?.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot purchase your own course",
      });
    }

    // Payment Id
    const transactionId = "TXN_" + new mongoose.Types.ObjectId().toString();

    // Delete pending status course
    await CoursePurchase.deleteMany({ userId, courseId, status: "pending" });

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
      data: {
        transactionId,
        course,
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
        // already purchased
        const alreadyPurchased = await CoursePurchase.findOne({
          paymentId: transactionId,
          status: "completed",
        });

        if (alreadyPurchased) {
          return res.status(200).json({
            success: true,
            message: "Payment already processed",
          });
        }

        const purchase = await CoursePurchase.findOne({
          paymentId: transactionId,
          status: "pending",
        }).populate({ path: "courseId" });

        if (!purchase) {
          return res.status(404).json({
            success: false,
            message: "Payment already processed",
          });
        }

        const status = "completed";

        // update purchase status
        purchase.status = status;
        await purchase.save();

        // Make all lecture visible by setting isPreviewFree to true
        if (purchase.courseId && purchase.courseId.lectures.length > 0) {
          await Lecture.updateMany(
            { _id: { $in: purchase.courseId.lectures } },
            { $set: { isPreviewFree: true } }
          );
        }

        // Update user's enrolled courses
        await User.findByIdAndUpdate(
          purchase.userId,
          { $addToSet: { enrolledCourse: purchase.courseId._id } },
          { new: true }
        );

        //Update course to add user id to enrolledStudents

        await Course.findByIdAndUpdate(
          purchase.courseId._id,
          { $addToSet: { enrolledStudents: purchase.userId } },
          { new: true }
        );

        await res.status(200).json({
          success: true,
          message: "Payment verified",
          purchase,
        });
      } catch (error) {
        console.log(error);
        return res.status(500).json({
          message: "Failed to complete payment",
        });
      }
    }, 8000);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to update payment",
    });
  }
};

// Check purchase status

export const getPurchaseDetails = async (req, res) => {
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

export const getCourseDetailsWithPurchaseStatus = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const course = await Course.findById(courseId)
      .populate({ path: "creator" })
      .populate({ path: "lectures" });

    const purchased = await CoursePurchase.findOne({
      userId,
      courseId,
      status: "completed",
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      course,
      purchased: !!purchased, // true if purchased, false otherwise
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to get purchase course details",
    });
  }
};

export const getAllPurchasedCourse = async (req, res) => {
  try {
    const instructorId = req.id;

    let purchasedCourse = await CoursePurchase.find({
      status: "completed",
    })
      .populate({
        path: "userId",
        select: "-password -__v",
      })
      .populate({
        path: "courseId",
        select: "courseTitle coursePrice creator",
      });

    // Deleted Course
    const invalidCourse = purchasedCourse.filter(
      (item) => item.courseId === null
    );

    if (invalidCourse.length > 0) {
      const deleteCourse = invalidCourse.map((course) => course._id);
      await CoursePurchase.deleteMany({ _id: { $in: deleteCourse } });
    }

    // Valid purchase
    purchasedCourse = purchasedCourse.filter(
      (course) => course.courseId !== null
    );

    //Instructor course
    purchasedCourse = purchasedCourse.filter((item) => {
      return item.courseId?.creator?.toString() === instructorId.toString();
    });

    if (!purchasedCourse) {
      return res.status(404).json({
        success: false,
        purchasedCourse: [],
      });
    }
    return res.status(200).json({
      purchasedCourse,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to get purchase course",
    });
  }
};
