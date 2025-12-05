import express from "express";
import {
  becomeInstructor,
  deleteProfile,
  getUserProfile,
  login,
  logout,
  register,
  updateProfile,
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import upload from "../utils/multer.js";

const router = express.Router();

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").post(logout);
router.route("/profile").get(isAuthenticated, getUserProfile);
router
  .route("/profile/update")
  .put(isAuthenticated, upload.single("profilePhoto"), updateProfile);
router.route("/profile/delete").delete(isAuthenticated, deleteProfile);
router.route("/become-instructor").patch(isAuthenticated, becomeInstructor);

export default router;
