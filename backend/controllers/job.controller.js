import Job from "../models/job.js";
import Application from "../models/Application.js";
import uploadOnCloudinary from "../config/cloudinary.js";
import fs from 'fs';

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

export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().sort({ datePosted: -1 });
    res.json(jobs);
  } catch (err) {
    console.error("Get jobs error:", err);
    res.status(500).json({ message: err.message });
  }
};

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

// ✅ COMPLETELY FIXED JOB APPLICATION
export const applyJob = async (req, res) => {
  try {
    console.log("📝 Application request:", {
      body: req.body,
      hasFile: !!req.file,
      filePath: req.file?.path
    });

    const { jobId, name, email } = req.body;
    const resumeFile = req.file;

    if (!jobId) {
      if (resumeFile && fs.existsSync(resumeFile.path)) {
        fs.unlinkSync(resumeFile.path);
      }
      return res.status(400).json({ 
        success: false,
        message: "Job ID is required" 
      });
    }
    
    if (!name) {
      if (resumeFile && fs.existsSync(resumeFile.path)) {
        fs.unlinkSync(resumeFile.path);
      }
      return res.status(400).json({ 
        success: false,
        message: "Name is required" 
      });
    }
    
    if (!email) {
      if (resumeFile && fs.existsSync(resumeFile.path)) {
        fs.unlinkSync(resumeFile.path);
      }
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

    const job = await Job.findById(jobId);
    if (!job) {
      if (fs.existsSync(resumeFile.path)) {
        fs.unlinkSync(resumeFile.path);
      }
      return res.status(404).json({ 
        success: false,
        message: "Job not found" 
      });
    }

    // ✅ CRITICAL: Check Cloudinary
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.error('❌ Cloudinary not configured');
      
      if (fs.existsSync(resumeFile.path)) {
        fs.unlinkSync(resumeFile.path);
      }
      
      return res.status(500).json({ 
        success: false,
        message: 'Server configuration error: Resume upload not available. Please contact admin.' 
      });
    }

    console.log("☁️ Uploading resume...");
    
    let resumeUrl;
    try {
      resumeUrl = await uploadOnCloudinary(resumeFile.path);
      
      if (!resumeUrl) {
        console.error('❌ Upload returned null');
        return res.status(500).json({ 
          success: false,
          message: "Failed to upload resume. Please try again." 
        });
      }
      
      console.log("✅ Resume uploaded:", resumeUrl);
    } catch (uploadError) {
      console.error('❌ Upload error:', uploadError.message);
      return res.status(500).json({ 
        success: false,
        message: `Upload failed: ${uploadError.message}` 
      });
    }

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
    console.error("❌ Application error:", error);
    
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
    }
    
    res.status(500).json({ 
      success: false,
      message: error.message || "Application submission failed"
    });
  }
};