import axios from "axios";

const api = axios.create({
  baseURL: "",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const tg = window.Telegram?.WebApp;

    if (tg?.initData) {
      config.headers.Authorization = `Bearer ${tg.initData}`;

      const pathParts = window.location.pathname.split("/");
      const payIndex = pathParts.indexOf("pay");

      const channelId = payIndex !== -1 ? pathParts[payIndex + 1] : null;

      if (channelId) {
        config.headers["X-Channel-Id"] = channelId;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export default api;
