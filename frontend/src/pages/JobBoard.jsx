import React, { useEffect, useState } from "react";
import axios from "axios";

export default function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [filters, setFilters] = useState({ location: "", type: "" });

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = () => {
    axios.get("/api/jobs", { params: filters }).then(res => setJobs(res.data));
  };

  const applyJob = (id) => {
    axios.post(`/api/jobs/${id}/apply`).then(() => {
      alert("Applied successfully");
    });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Job Board</h1>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Location"
          className="border p-2 rounded w-1/3"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
        />
        <select
          className="border p-2 rounded w-1/3"
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="">Job Type</option>
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Contract</option>
          <option>Internship</option>
        </select>
      </div>

      {/* Job List */}
      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job._id} className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold">{job.title}</h2>
            <p className="text-gray-600">{job.company} — {job.location}</p>
            <p className="mt-2 text-sm">{job.description.slice(0, 150)}...</p>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => applyJob(job._id)}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Apply
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
