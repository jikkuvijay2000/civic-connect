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

        // ── Kill Switch: backend returned 503 ──────────────────────────────
        if (err.response?.status === 503 && err.response?.data?.status === 'kill_switch') {
            window.dispatchEvent(new CustomEvent('civic:kill_switch'));
            return Promise.reject(err);
        }
        // ──────────────────────────────────────────────────────────────────

        if (err.response?.status === 401 && !originalRequest._retry && originalRequest.url !== "/user/refresh") {
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
