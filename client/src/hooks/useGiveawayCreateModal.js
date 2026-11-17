import { useHaptic } from "../hooks/useHaptic.js";
import { useState } from "react";
import { useTelegram } from "../context/TelegramContext.jsx";
import api from "../api/axios.js";

export function useGiveawayCreateModal(
  channelId,
  setIsGiveawayModalOpen,
  loadData,
  formattedServices,
) {
  const { tg } = useTelegram();
  const [giveawayTitle, setGiveawayTitle] = useState("");
  const [giveawayWinners, setGiveawayWinners] = useState("1");
  const [giveawayServiceId, setGiveawayServiceId] = useState("");
  const [giveawayDurationDays, setGiveawayDurationDays] = useState("30");
  const { lightClick, mediumClick, notificationSuccess, notificationError } =
    useHaptic();

  const handleCreateGiveaway = async (e) => {
    e.preventDefault();
    mediumClick();
    try {
      console.log({
        title: giveawayTitle,
        winners_count: parseInt(giveawayWinners),
        service_id: giveawayServiceId ? parseInt(giveawayServiceId) : null,
        duration_days: parseInt(giveawayDurationDays),
      });
      const res = await api.post(`/api/channels/${channelId}/giveaways`, {
        title: giveawayTitle,
        winners_count: parseInt(giveawayWinners),
        service_id: giveawayServiceId ? parseInt(giveawayServiceId) : null,
        duration_days: parseInt(giveawayDurationDays),
      });

      if (res.data.success) {
        notificationSuccess();
        setIsGiveawayModalOpen(false);
        setGiveawayTitle("");
        setGiveawayWinners("1");
        if (typeof loadData === "function") loadData();
      }
    } catch (err) {
      notificationError();
      tg?.showPopup?.({
        title: "Ошибка",
        message: err.response?.data?.error || "Не удалось запустить розыгрыш",
      });
    }
  };

  return {
    giveawayTitle,
    setGiveawayTitle,
    giveawayWinners,
    setGiveawayWinners,
    giveawayServiceId,
    setGiveawayServiceId,
    giveawayDurationDays,
    setGiveawayDurationDays,
    handleCreateGiveaway,
  };
}
