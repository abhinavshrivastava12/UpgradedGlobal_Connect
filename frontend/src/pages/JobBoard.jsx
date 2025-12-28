import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  X,
  Plus,
  Search,
  MapPin,
  Building,
  Briefcase,
  Upload,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Nav from "../components/Nav";

function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);

  // Apply form states
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [resume, setResume] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      axios.defaults.withCredentials = true;
    }
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await axios.get("/api/jobs");
      
      if (Array.isArray(res.data)) {
        setJobs(res.data);
      } else {
        console.error("API response for jobs is not an array:", res.data);
        setJobs([]);
      }
    } catch (error) {
      console.error("Fetch jobs error:", error);
      if (error.response?.status === 401) {
        toast.error("Please login to continue");
      }
      setJobs([]);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const addJob = async () => {
    if (!title || !company || !location || !description) {
      toast.error("All fields are required!");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      };

      await axios.post("/api/jobs/add", {
        title,
        company,
        location,
        description,
      }, config);
      
      toast.success("Job added successfully!");
      setTitle("");
      setCompany("");
      setLocation("");
      setDescription("");
      setIsModalOpen(false);
      fetchJobs();
    } catch (error) {
      console.error("Add job error:", error);
      if (error.response?.status === 401) {
        toast.error("Please login to post jobs");
      } else {
        toast.error("Failed to add job!");
      }
    }
  };

  const deleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job?")) return;

    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        withCredentials: true
      };

      await axios.delete(`/api/jobs/${jobId}`, config);
      toast.success("Job deleted successfully!");
      fetchJobs();
    } catch (error) {
      console.error("Delete job error:", error);
      if (error.response?.status === 401) {
        toast.error("Please login to delete jobs");
      } else {
        toast.error("Failed to delete job!");
      }
    }
  };
  
  const handleResumeChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setResume(file);
    } else {
      setResume(null);
      toast.error("Please upload a PDF file.");
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    
    if (!applicantName || !applicantEmail || !resume) {
      toast.error("Please fill all fields and upload your resume.");
      return;
    }
    
    setIsApplying(true);
    
    try {
      const formData = new FormData();
      formData.append("name", applicantName);
      formData.append("email", applicantEmail);
      formData.append("resume", resume);
      formData.append("jobId", selectedJob._id);

      const response = await axios.post(
        "/api/jobs/apply", 
        formData, 
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          withCredentials: true
        }
      );

      toast.success("Application submitted successfully!");
      setIsApplyModalOpen(false);
      setApplicantName("");
      setApplicantEmail("");
      setResume(null);
      setSelectedJob(null);
      
    } catch (error) {
      console.error("Application error:", error);
      
      if (error.response) {
        if (error.response.status === 401) {
          toast.error("Authentication failed. Please login again.");
        } else if (error.response.status === 400) {
          toast.error(error.response.data.message || "Invalid application data");
        } else {
          toast.error("Server error. Please try again later.");
        }
      } else if (error.request) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("Failed to submit application.");
      }
    } finally {
      setIsApplying(false);
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Nav />
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />

      {/* Header Section */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border-b border-slate-700 mt-[80px]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Find Your Dream Job
            </h1>
            <p className="text-gray-400 text-lg">
              Discover amazing opportunities from top companies
            </p>
          </div>

          {/* Search & Add Job */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Post New Job
            </button>
          </div>
        </div>
      </div>

      {/* Job Cards */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job._id}
                className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700 hover:border-purple-500/50 transition-all duration-300 shadow-xl"
              >
                <div className="flex items-start justify-between mb-4 gap-2">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Briefcase className="w-6 h-6 text-purple-400" />
                  </div>
                  {/* Apply & Delete Buttons */}
                  <div className="flex space-x-2">
                    <button
                        onClick={() => {
                            setSelectedJob(job);
                            setIsApplyModalOpen(true);
                        }}
                        className="px-4 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-all font-medium"
                    >
                        Apply
                    </button>
                    <button
                        onClick={() => deleteJob(job._id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-all font-medium"
                    >
                        Delete
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {job.title}
                </h3>
                <div className="flex items-center gap-2 text-gray-300 mb-2">
                  <Building className="w-4 h-4 text-purple-400" />
                  <span>{job.company}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300 mb-3">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span>{job.location}</span>
                </div>
                <p className="text-gray-400 text-sm line-clamp-3 mb-4">
                  {job.description}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-700 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Briefcase className="w-10 h-10 text-gray-500" />
            </div>
            <p className="text-gray-400 text-lg mb-2">No jobs found</p>
            <p className="text-gray-500">Try adjusting your search terms</p>
          </div>
        )}
      </div>

      {/* Add Job Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative border border-slate-700">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
            <h2 className="text-2xl font-bold text-white mb-4">
              Post a New Job
            </h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Job Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Company Name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
              <textarea
                placeholder="Job Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-slate-600 rounded-lg text-gray-300 hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addJob}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium"
                >
                  Post Job
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Apply Job Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 relative border border-slate-700">
              <button
                  onClick={() => setIsApplyModalOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-700 transition-colors"
              >
                  <X className="w-5 h-5 text-gray-400" />
              </button>
              <h2 className="text-2xl font-bold text-white mb-4">
                  Apply for {selectedJob?.title}
              </h2>
              <p className="text-gray-400 mb-6">at {selectedJob?.company}</p>
              <form className="space-y-4" onSubmit={handleApply}>
                  <input
                      type="text"
                      placeholder="Your Name"
                      value={applicantName}
                      onChange={(e) => setApplicantName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      required
                  />
                  <input
                      type="email"
                      placeholder="Your Email"
                      value={applicantEmail}
                      onChange={(e) => setApplicantEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                      required
                  />
                  <div className="relative flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-600 rounded-lg text-center bg-slate-700/50 hover:border-purple-500 transition-colors">
                      {resume ? (
                          <div className="flex items-center gap-2">
                              <Upload className="w-5 h-5 text-green-400" />
                              <p className="text-green-400 font-medium">{resume.name}</p>
                          </div>
                      ) : (
                          <>
                              <Upload className="w-8 h-8 text-gray-400 mb-2" />
                              <p className="text-gray-400 text-sm">
                                  Upload your resume (PDF only)
                              </p>
                          </>
                      )}
                      <input
                          type="file"
                          accept=".pdf"
                          onChange={handleResumeChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          style={{ zIndex: 1 }}
                          required
                      />
                  </div>
                  <div className="flex gap-3">
                      <button
                          type="button"
                          onClick={() => setIsApplyModalOpen(false)}
                          className="flex-1 py-3 border border-slate-600 rounded-lg text-gray-300 hover:bg-slate-700 transition-colors"
                      >
                          Cancel
                      </button>
                      <button
                          type="submit"
                          disabled={isApplying}
                          className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                      >
                          {isApplying ? "Submitting..." : "Submit Application"}
                      </button>
                  </div>
              </form>
            </div>
        </div>
      )}
    </div>
  );
}

export default JobBoard;