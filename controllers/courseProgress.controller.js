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
    }).populate("courseId");

    const courseDetails = await Course.findById(courseId);
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
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Failed to update lecture progress",
    });
  }
};
