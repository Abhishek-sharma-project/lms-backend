import express from "express";
import { createCourse } from "../controllers/course.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.route("/").post(isAuthenticated, createCourse);

export default router;
