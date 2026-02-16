import axios from "axios";
import { BASE_URL } from "../services/baseUrl";

const api = axios.create({
    baseURL: BASE_URL,
    withCredentials: true
});

api.interceptors.response.use(
    res => res,
    async err => {
        const originalRequest = err.config;

        if (err.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                await api.post("/user/refresh");
                return api(originalRequest);
            } catch {
                window.location.href = "/";
            }
        }

        return Promise.reject(err);
    }
);

export default api;
