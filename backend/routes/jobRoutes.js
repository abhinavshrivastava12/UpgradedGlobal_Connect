import express from "express";
import Job from "../models/job.js";
import isAuth from "../middlewares/isAuth.js";

const router = express.Router();

// Post a new job
router.post("/", isAuth, async (req, res) => {
  try {
    const job = new Job({ ...req.body, postedBy: req.user.id });
    await job.save();
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: "Error posting job" });
  }
});

// Get jobs with filters
router.get("/", async (req, res) => {
  try {
    const { location, type } = req.query;
    let query = {};
    if (location) query.location = location;
    if (type) query.type = type;
    const jobs = await Job.find(query).populate("postedBy", "firstName lastName");
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching jobs" });
  }
});

// Apply for a job
router.post("/:id/apply", isAuth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (!job.applicants.includes(req.user.id)) {
      job.applicants.push(req.user.id);
      await job.save();
    }
    res.json({ message: "Applied successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error applying" });
  }
});

// Get applicants for a job (only job poster)
router.get("/:id/applicants",isAuth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("applicants", "firstName lastName email");
    if (!job) return res.status(404).json({ message: "Job not found" });

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(job.applicants);
  } catch (error) {
    res.status(500).json({ message: "Error fetching applicants" });
  }
});

export default router;
