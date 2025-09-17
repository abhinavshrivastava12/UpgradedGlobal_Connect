import { Router } from "express";
import {
  addJob,
  getJobs,
  deleteJob,
  applyJob
} from "../controllers/job.controller.js";
import upload from "../middlewares/multer.js";
import isAuth from "../middlewares/isAuth.js";

const router = Router();

// Existing routes pointing to the new controller
router.post("/add", isAuth, addJob);
router.get("/", getJobs);
router.delete("/:id", isAuth, deleteJob);

// New route for job applications
router.post("/apply", isAuth, upload.single('resume'), applyJob);

export default router;