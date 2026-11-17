import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTelegram } from "../context/TelegramContext.jsx";
import api from "../api/axios.js";

export function useTelegramAuthAndRoute() {
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function initApp() {
      if (!tg || !tg.initData) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.post("/api/auth");
        const data = response.data;
        if (!data.success) {
          throw new Error(data.error || "Auth failed");
        }

        setUser(data.user);
        setIsAuthenticated(true);

        const startParam = tg?.initDataUnsafe?.start_param;
        if (!startParam) {
          //navigate("/", { replace: true });
          return;
        }

        // Ветка А: Оплата канала / витрина услуг
        if (!isNaN(startParam)) {
          navigate(`/pay/${startParam}`, { replace: true });
          return;
        }

        // Ветка Б: Рефералка на будущее
        if (startParam.startsWith("ref_")) {
          const refId = startParam.replace("ref_", "");
          navigate(`/?ref=${refId}`, { replace: true });
          return;
        }

        navigate("/", { replace: true });
      } catch (error) {
        const errorMessage = error.response?.data?.error || error.message;
        console.error("💥 Auth error:", errorMessage);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }

    initApp();
  }, [tg, navigate]);

  return { isLoading, isAuthenticated, user };
}
