import { Course } from "../models/course.model.js";
import { CourseProgress } from "../models/courseProgress.js";
import PDFDocument from "pdfkit";
import { User } from "../models/user.model.js";

export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    // Step-1 find the user course progress
    let courseProgress = await CourseProgress.findOne({
      courseId,
      userId,
    });

    const courseDetails = await Course.findById(courseId).populate("lectures");
    if (!courseDetails) {
      return res.status(404).json({
        message: "Course not found",
      });
    }

    // Lecture contain video
    const showLecture = courseDetails.lectures.filter(
      (lecture) => lecture.videoUrl
    );

    courseDetails.lectures = showLecture;

    // Step-2 If no progress found, return course details with an empty progress
    if (!courseProgress) {
      return res.status(200).json({
        data: {
          courseDetails,
          progress: [],
          completed: false,
        },
      });
    }

    // Step-3 Return the user's course progress along with course details

    return res.status(200).json({
      data: {
        courseDetails,
        progress: courseProgress.lectureProgress,
        completed: courseProgress.completed,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to get course progress",
    });
  }
};

export const updateLectureProgress = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const userId = req.id;

    // create course progress
    let courseProgress = await CourseProgress.findOne({
      courseId,
      userId,
    });

    if (!courseProgress) {
      // if course progress not exist, create a new record
      courseProgress = new CourseProgress({
        userId,
        courseId,
        completed: false,
        lectureProgress: [],
      });
    }

    // find lecture progress from course progress
    const lectureIndex = courseProgress.lectureProgress.findIndex(
      (lecture) => lecture.lectureId === lectureId
    );

    if (lectureIndex !== -1) {
      // if lecture already exits, update its status
      courseProgress.lectureProgress[lectureIndex].viewed = true;
    } else {
      // Add new lecture progress
      courseProgress.lectureProgress.push({
        lectureId,
        viewed: true,
      });
    }

    // if all lecture is complete
    const lectureProgressLength = courseProgress.lectureProgress.filter(
      (lectureProg) => lectureProg.viewed
    ).length;

    const course = await Course.findById(courseId);

    if (course.lectures.length === lectureProgressLength)
      courseProgress.completed = true;

    await courseProgress.save();

    return res.status(200).json({
      message: "Lecture progress updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to update lecture progress",
    });
  }
};

export const markAsCompleted = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const courseProgress = await CourseProgress.findOne({
      courseId,
      userId,
    });
    if (!courseProgress) {
      return res.status(404).json({
        message: "Course progress not found",
      });
    }

    courseProgress.lectureProgress.map(
      (lectureProgress) => (lectureProgress.viewed = true)
    );
    courseProgress.completed = true;
    await courseProgress.save();

    return res.status(200).json({
      message: "Course marked as completed",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to mark completed",
    });
  }
};

export const markAsInCompleted = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    const courseProgress = await CourseProgress.findOne({
      courseId,
      userId,
    });
    if (!courseProgress) {
      return res.status(404).json({
        message: "Course progress not found",
      });
    }

    courseProgress.lectureProgress.map(
      (lectureProgress) => (lectureProgress.viewed = false)
    );
    courseProgress.completed = false;
    await courseProgress.save();

    return res.status(200).json({
      message: "Course marked as incompleted",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to mark Incompleted",
    });
  }
};

export const getCertificate = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.id;

    // User & course
    const user = await User.findById(userId).select("name email");
    const course = await Course.findById(courseId)
      .populate("creator", "name")
      .select("courseTitle creator");

    if (!user || !course) {
      return res.status(404).json({ message: "Not found" });
    }

    // Check course completion
    const progress = await CourseProgress.findOne({ userId, courseId });
    if (!progress || !progress.completed) {
      return res.status(400).json({ message: "Course not completed yet" });
    }

    // PDF setup
    const doc = new PDFDocument({ size: "A4", margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${user.name}-certificate.pdf`
    );

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;

    // Background + border
    doc.rect(0, 0, pageWidth, pageHeight).fill("#FAFAFA");
    doc
      .lineWidth(4)
      .strokeColor("#2563EB")
      .rect(25, 25, pageWidth - 50, pageHeight - 50)
      .stroke();

    // Background text
    doc.save();
    doc
      .font("Helvetica-Bold")
      .fontSize(70)
      .fillColor("#2563EB", 0.08)
      .rotate(-20, { origin: [pageWidth / 2, pageHeight / 2] })
      .text("CodeStack", pageWidth / 2 - 200, pageHeight / 2 - 40, {
        width: 400,
        align: "center",
      });
    doc.restore();

    // Main content start
    doc.y = 120;

    // Title
    doc
      .fillColor("#2563EB")
      .font("Helvetica-Bold")
      .fontSize(38)
      .text("CERTIFICATE OF COMPLETION", { align: "center" });

    doc.y += 70;

    // Student name
    doc
      .fillColor("#000")
      .font("Helvetica-Bold")
      .fontSize(34)
      .text(user.name, { align: "center" });

    doc.y += 25;

    // Subtext
    doc
      .font("Helvetica")
      .fontSize(18)
      .fillColor("#444")
      .text("has successfully completed the course:", {
        align: "center",
      });

    doc.y += 40;

    // Course title
    doc
      .font("Helvetica-Bold")
      .fontSize(30)
      .fillColor("#2563EB")
      .text(`"${course.courseTitle}"`, { align: "center" });

    doc.y += 90;

    //Details
    doc
      .fillColor("#000")
      .font("Helvetica")
      .fontSize(16)
      .text(`Instructor: ${course.creator.name}`, { align: "center" });

    doc.y += 12;
    doc.text("Issued By: CodeStack LMS", { align: "center" });

    doc.y += 12;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: "center" });

    // Signature bottom
    doc.y = pageHeight - 150;

    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#2563EB")
      .text("CodeStack", { align: "center" });

    doc
      .font("Helvetica")
      .fontSize(14)
      .fillColor("#000")
      .text("Authorized Signature", { align: "center" });

    doc.end();
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Certificate generation failed",
    });
  }
};
