import React, { useEffect, useState } from "react";
import axios from "axios";
import Nav from "../components/Nav";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      const res = await axios.get("http://localhost:8000/api/jobs");
      setJobs(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // Add job
  const addJob = async () => {
    if (!title.trim() || !description.trim() || !location.trim()) return;
    try {
      await axios.post("http://localhost:8000/api/jobs", {
        title,
        description,
        location,
      });
      setTitle("");
      setDescription("");
      setLocation("");
      fetchJobs();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Filter jobs by search
  const filteredJobs = jobs.filter((job) =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1F71] to-[#2C2C2C]">
      {/* Navbar */}
      <Nav />

      {/* Add Job & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between mt-[80px] sm:items-center px-4 py-4 bg-white shadow-md gap-3">
        {/* Add Job Form */}
        <div className="flex flex-col sm:flex-row sm:space-x-2 gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border p-2 rounded w-full sm:w-auto"
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border p-2 rounded w-full sm:w-auto"
          />
          <input
            type="text"
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border p-2 rounded w-full sm:w-auto"
          />
          <button
            onClick={addJob}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
          >
            Add Job
          </button>
        </div>

        {/* Search Job */}
        <input
          type="text"
          placeholder="Search Job..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 rounded w-full sm:w-60"
        />
      </div>

      {/* Job Cards */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <div
              key={job._id}
              className="bg-white shadow-md rounded-lg p-4 border hover:shadow-lg transition duration-200"
            >
              <h3 className="text-lg font-bold text-gray-800">Title: {job.title}</h3>
              <p className="text-gray-600 text-sm mt-2">Discription: {job.description}</p>
              <p className="text-gray-500 text-xs mt-2">Location: {job.location}</p>
            </div>
          ))
        ) : (
          <p className="text-center col-span-full text-gray-500">
            No jobs available
          </p>
        )}
      </div>
    </div>
  );
}

export default Jobs;
