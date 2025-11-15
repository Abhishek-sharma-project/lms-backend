import { Course } from "../models/course.model.js";
import { CourseProgress } from "../models/courseProgress.js";

export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId } = req.id;

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
    const { userId } = req.id;

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
    const { userId } = req.id;

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
    const { userId } = req.id;

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
