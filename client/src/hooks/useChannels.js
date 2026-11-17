import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useTelegram } from "../context/TelegramContext.jsx";
import { useHaptic } from "./useHaptic.js";

export function useChannels() {
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const { lightClick, mediumClick, notificationSuccess } = useHaptic();

  const [channels, setChannels] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleGoBack = useCallback(() => {
    if (typeof lightClick === "function") lightClick();

    console.log("⬅️ Нажат нативный BackButton на проде. Уходим на /");
    navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    const button = window.Telegram?.WebApp?.BackButton;
    if (!button) return;

    button.show();
    button.onClick(handleGoBack);

    return () => {
      button.offClick(handleGoBack);
    };
  }, [handleGoBack]);

  const handleRefresh = async (isManualClick = false) => {
    if (isManualClick) lightClick();
    setRefreshing(true);
    try {
      const res = await api.get("/api/channels");
      setChannels(res.data.channels || []);
    } catch (err) {
      console.error("Ошибка обновления списка каналов:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  const openModal = () => {
    mediumClick();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    lightClick();
    setIsModalOpen(false);
  };

  const confirmModal = () => {
    notificationSuccess();
    setIsModalOpen(false);
    handleRefresh();
  };

  const navigateToChannel = (channelId) => {
    lightClick();
    navigate(`/channels/${channelId}`);
  };

  return {
    channels,
    isModalOpen,
    refreshing,
    handleRefresh: () => handleRefresh(true),
    openModal,
    closeModal,
    confirmModal,
    navigateToChannel,
  };
}
