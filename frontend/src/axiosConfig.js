import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://upgradedglobal-connect.onrender.com", // backend port
  withCredentials: true,            // cookies send/receive
});

export default axiosInstance;
