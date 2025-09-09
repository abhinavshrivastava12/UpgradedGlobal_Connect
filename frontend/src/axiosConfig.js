import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000", // backend port
  withCredentials: true,            // cookies send/receive
});

export default axiosInstance;
