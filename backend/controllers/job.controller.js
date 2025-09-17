import Job from "../models/Job.js";
import Application from "../models/Application.js";
import uploadOnCloudinary from "../config/cloudinary.js";

// Add Job
export const addJob = async (req, res) => {
  try {
    console.log("Add job request received");
    console.log("Request body:", req.body);
    console.log("Request user:", req.user || req.userId);

    const { title, company, location, description } = req.body;
    if (!title || !company || !location || !description) {
      return res.status(400).json({ message: "All fields are required" });
    }
    const job = new Job({ title, company, location, description });
    await job.save();
    res.json({ message: "Job added successfully", job });
  } catch (err) {
    console.error("Add job error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get all jobs
export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ datePosted: -1 });
    res.json(jobs);
  } catch (err) {
    console.error("Get jobs error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Delete Job
export const deleteJob = async (req, res) => {
  try {
    console.log("Delete job request received");
    console.log("Request params:", req.params);
    console.log("Request user:", req.user || req.userId);

    const { id } = req.params;
    const job = await Job.findByIdAndDelete(id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    console.error("Delete job error:", err);
    res.status(500).json({ message: err.message });
  }
};

// Handle job applications
export const applyJob = async (req, res) => {
  try {
    console.log("Apply job request received");
    console.log("Request body:", req.body);
    console.log("Request file:", req.file);
    console.log("Request user:", req.user || req.userId);
    console.log("Request cookies:", req.cookies);
    console.log("Request headers authorization:", req.headers.authorization);

    const { jobId, name, email } = req.body;
    const resumeFile = req.file;

    // Validate required fields
    if (!jobId) {
      return res.status(400).json({ message: "Job ID is required" });
    }
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!resumeFile) {
      return res.status(400).json({ message: "Resume file is required" });
    }

    // Validate job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Upload resume to Cloudinary
    console.log("Uploading resume to Cloudinary...");
    const resumeUrl = await uploadOnCloudinary(resumeFile.path);
    
    if (!resumeUrl) {
      return res.status(500).json({ message: "Failed to upload resume" });
    }

    console.log("Resume uploaded successfully:", resumeUrl);

    // Create a new application
    const application = new Application({
      jobId,
      applicantName: name,
      applicantEmail: email,
      resumeUrl
    });

    await application.save();
    console.log("Application saved successfully");

    res.status(200).json({ 
      message: "Application submitted successfully",
      application: {
        id: application._id,
        jobTitle: job.title,
        company: job.company
      }
    });

  } catch (error) {
    console.error("Apply job error:", error);
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: "Validation error", 
        details: error.message 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: "Invalid job ID format" 
      });
    }
    
    res.status(500).json({ 
      message: "Internal server error while processing application",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};