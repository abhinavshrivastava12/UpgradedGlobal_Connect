import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "/api", 
});

// Interceptor: har request ke sath token bhejega
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // login ke baad token store karo
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
