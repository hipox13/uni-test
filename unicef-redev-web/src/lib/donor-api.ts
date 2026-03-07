import axios from "axios";
import { getDonorToken, clearDonorToken } from "./donor-auth";

const donorApi = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002"}/api/v1`,
});

donorApi.interceptors.request.use((config) => {
  const token = getDonorToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

donorApi.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clearDonorToken();
      if (typeof window !== "undefined") {
        window.location.href = "/en/donor/login";
      }
    }
    return Promise.reject(error);
  },
);

export default donorApi;
