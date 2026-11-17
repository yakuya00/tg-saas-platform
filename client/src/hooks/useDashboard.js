import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useTelegram } from "../context/TelegramContext.jsx";
import { useHaptic } from "./useHaptic.js";

export function useDashboard() {
  const { tg, user } = useTelegram();
  const { lightClick } = useHaptic();
  const navigate = useNavigate();
  const [countChannels, setCountChannels] = useState(0);

  useEffect(() => {
    api
      .get("/api/channels/count")
      .then((res) => setCountChannels(res.data.count || 0))
      .catch((err) => console.error("Ошибка загрузки счетчика каналов:", err));

    const button = window.Telegram?.WebApp?.BackButton;
    if (button) {
      button.hide();
    }
  }, []);

  const navigateToModule = (path) => {
    if (typeof lightClick === "function") lightClick();
    navigate(path, { replace: true });
  };

  return {
    user,
    countChannels,
    navigateToModule,
  };
}
