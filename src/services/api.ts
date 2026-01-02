import axios from "axios";

// 1. Create an Axios instance
const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default {
  // AI Services
  translateText(text: string, targetLang: string = "French") {
    return apiClient.post("/tools/translate", {
      text,
      target_lang: targetLang,
    });
  },

  summarizeText(text: string) {
    return apiClient.post("/tools/summarize", { text });
  },

  // Auth Services
  login(credentials: { email: string; password: string }) {
    const params = new URLSearchParams();
    params.append("username", credentials.email);
    params.append("password", credentials.password);
    return apiClient.post("/auth/login", params);
  },

  register(userData: object) {
    return apiClient.post("/auth/signup", userData);
  },

  getUser() {
    return apiClient.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt_token")}`,
      },
    });
  },

  // History Services
  getHistory(page: number = 1, perPage: number = 20) {
    return apiClient.get("/history/", { params: { page, per_page: perPage } });
  },

  getHistorySummaries(page: number = 1, perPage: number = 20) {
    return apiClient.get("/history/summaries", {
      params: { page, per_page: perPage },
    });
  },

  getHistoryTranslations(page: number = 1, perPage: number = 20) {
    return apiClient.get("/history/translations", {
      params: { page, per_page: perPage },
    });
  },

  deleteTranslation(id: string) {
    return apiClient.delete(`/history/translations/${id}`);
  },

  deleteSummary(id: string) {
    return apiClient.delete(`/history/summaries/${id}`);
  },
};
