import React, { useEffect, useState } from "react";
import axios from "axios";
import { X, Plus, Search, MapPin, Building, FileText, Briefcase, Upload } from "lucide-react";
import Nav from "../components/Nav";

function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/jobs");
      setJobs(res.data);
    } catch (error) {
      console.error(error.response ? error.response.data : error.message);
    }
  };

  // Add job
  const addJob = async () => {
    if (!title.trim() || !company.trim() || !description.trim() || !location.trim()) {
      alert("All fields are required");
      return;
    }
    try {
      await axios.post("http://localhost:8000/api/jobs/add", {
        title,
        company,
        description,
        location,
      });
      setTitle("");
      setCompany("");
      setDescription("");
      setLocation("");
      setIsModalOpen(false);
      fetchJobs();
    } catch (error) {
      console.error(error.response ? error.response.data : error.message);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Filter jobs by search
  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle "View Details"
  const handleViewDetails = (job) => {
    setSelectedJob(job);
  };

  // Close Modal
  const closeDetailsModal = () => {
    setSelectedJob(null);
  };

  // Handle Apply Job
  const handleApplyJob = async (e) => {
    e.preventDefault();
    if (!applicantName || !applicantEmail || !resume) {
      alert("Please fill all fields and upload your resume!");
      return;
    }

    setIsApplying(true);
    const formData = new FormData();
    formData.append("name", applicantName);
    formData.append("email", applicantEmail);
    formData.append("resume", resume);
    formData.append("jobId", selectedJob._id);

    try {
      await axios.post("http://localhost:8000/api/jobs/apply", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Application submitted successfully!");
      setApplicantName("");
      setApplicantEmail("");
      setResume(null);
      setSelectedJob(null);
    } catch (error) {
      alert("Failed to apply. Please try again.");
      console.error(error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {/* Navbar */}
      <Nav />

      {/* Header Section */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 mt-[80px]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
              Find Your Dream Job
            </h1>
            <p className="text-white/80 text-lg">Discover amazing opportunities from top companies</p>
          </div>

          {/* Search and Add Job Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search jobs, companies, or locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
              />
            </div>

            {/* Add Job Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:from-pink-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
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
                className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 hover:border-white/30 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                    <Briefcase className="w-6 h-6 text-purple-300" />
                  </div>
                  <span className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">
                    New
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors">
                  {job.title}
                </h3>

                <div className="flex items-center gap-2 text-white/80 mb-3">
                  <Building className="w-4 h-4" />
                  <span className="text-sm">{job.company}</span>
                </div>

                <div className="flex items-center gap-2 text-white/80 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{job.location}</span>
                </div>

                <p className="text-white/70 text-sm leading-relaxed mb-4 line-clamp-3">
                  {job.description}
                </p>

                <button
                  onClick={() => handleViewDetails(job)}
                  className="w-full py-2 px-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-white rounded-lg hover:from-purple-500/30 hover:to-pink-500/30 hover:border-purple-400/50 transition-all duration-200 text-sm font-medium"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-white/60 text-lg mb-2">No jobs found</p>
            <p className="text-white/40">Try adjusting your search terms</p>
          </div>
        )}
      </div>

      {/* Job Details Modal with Apply Form */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 relative animate-fadeIn">
            <button
              onClick={closeDetailsModal}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <h2 className="text-3xl font-bold text-gray-800 mb-3">{selectedJob.title}</h2>
            <div className="flex items-center gap-2 mb-2 text-gray-600">
              <Building className="w-4 h-4" />
              <span className="text-md">{selectedJob.company}</span>
            </div>
            <div className="flex items-center gap-2 mb-4 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="text-md">{selectedJob.location}</span>
            </div>
            <p className="text-gray-700 leading-relaxed mb-6">{selectedJob.description}</p>

            {/* Apply Form */}
            <form onSubmit={handleApplyJob} className="space-y-4">
              <input
                type="text"
                placeholder="Your Name"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
              <input
                type="email"
                placeholder="Your Email"
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-3 bg-purple-100 border border-purple-300 rounded-lg cursor-pointer hover:bg-purple-200 transition">
                  <Upload className="w-5 h-5 text-purple-700" />
                  <span className="text-purple-700 font-medium">
                    {resume ? resume.name : "Upload Resume"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setResume(e.target.files[0])}
                    className="hidden"
                    required
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={isApplying}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg shadow-md hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                {isApplying ? "Applying..." : "Apply Now"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobBoard;