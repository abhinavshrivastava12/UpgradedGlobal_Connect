import Job from "../models/job.js";
import Application from "../models/Application.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import fs from 'fs';

// Add Job
export const addJob = async (req, res) => {
  try {
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

// ✅ FIXED: Job Application Handler
export const applyJob = async (req, res) => {
  try {
    console.log("📝 Job application request:", {
      body: req.body,
      file: req.file,
      userId: req.userId
    });

    const { jobId, name, email } = req.body;
    const resumeFile = req.file;

    // Validate fields
    if (!jobId) {
      return res.status(400).json({ 
        success: false,
        message: "Job ID is required" 
      });
    }
    
    if (!name) {
      return res.status(400).json({ 
        success: false,
        message: "Name is required" 
      });
    }
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: "Email is required" 
      });
    }
    
    if (!resumeFile) {
      return res.status(400).json({ 
        success: false,
        message: "Resume file is required" 
      });
    }

    // Validate job exists
    const job = await Job.findById(jobId);
    if (!job) {
      // Clean up file
      if (fs.existsSync(resumeFile.path)) {
        fs.unlinkSync(resumeFile.path);
      }
      
      return res.status(404).json({ 
        success: false,
        message: "Job not found" 
      });
    }

    // ✅ FIX: Check Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary credentials not configured');
      
      // Clean up file
      if (fs.existsSync(resumeFile.path)) {
        fs.unlinkSync(resumeFile.path);
      }
      
      return res.status(500).json({ 
        success: false,
        message: 'Server configuration error: Resume upload not configured' 
      });
    }

    console.log("☁️ Uploading resume to Cloudinary...");
    
    let resumeUrl;
    try {
      resumeUrl = await uploadOnCloudinary(resumeFile.path);
      
      if (!resumeUrl) {
        console.error('❌ Cloudinary upload failed - no URL returned');
        return res.status(500).json({ 
          success: false,
          message: "Failed to upload resume" 
        });
      }
      
      console.log("✅ Resume uploaded:", resumeUrl);
    } catch (uploadError) {
      console.error('❌ Resume upload error:', uploadError);
      return res.status(500).json({ 
        success: false,
        message: "Resume upload failed: " + uploadError.message
      });
    }

    // Create application
    const application = new Application({
      jobId,
      applicantName: name,
      applicantEmail: email,
      resumeUrl
    });

    await application.save();
    console.log("✅ Application saved:", application._id);

    res.status(200).json({ 
      success: true,
      message: "Application submitted successfully",
      application: {
        id: application._id,
        jobTitle: job.title,
        company: job.company
      }
    });

  } catch (error) {
    console.error("❌ Apply job error:", error);
    
    // Clean up file if exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('❌ File cleanup error:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};