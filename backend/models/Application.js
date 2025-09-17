import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    required: true,
  },
  applicantName: {
    type: String,
    required: true,
  },
  applicantEmail: {
    type: String,
    required: true,
  },
  resumeUrl: {
    type: String, // URL to the resume file on Cloudinary
    required: true,
  },
  appliedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Application", applicationSchema);