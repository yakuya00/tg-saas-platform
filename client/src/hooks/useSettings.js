import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTelegram } from "../context/TelegramContext.jsx";
import { useHaptic } from "./useHaptic.js";

export function useSettings() {
  const navigate = useNavigate();
  const { tg, user } = useTelegram();
  const { lightClick } = useHaptic();

  useEffect(() => {
    if (!tg?.BackButton) return;

    const handleGoBack = () => {
      lightClick();
      navigate("/", { replace: true });
    };

    tg.BackButton.show();
    tg.BackButton.onClick(handleGoBack);

    return () => {
      tg.BackButton.offClick(handleGoBack);
    };
  }, [tg, navigate]);

  return {
    user,
    platformVersion: "v1.0.0",
  };
}
