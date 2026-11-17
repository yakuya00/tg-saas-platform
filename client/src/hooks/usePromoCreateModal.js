import { useHaptic } from "../hooks/useHaptic.js";
import { useState } from "react";
import { useTelegram } from "../context/TelegramContext.jsx";
import api from "../api/axios.js";

export function usePromoCreateModal(channelId, setIsPromoModalOpen, loadData) {
  const { tg } = useTelegram();
  const [promoCode, setPromoCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage"); // percentage | fixed
  const [discountValue, setDiscountValue] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const { lightClick, mediumClick, notificationSuccess, notificationError } =
    useHaptic();

  const handleCreatePromo = async (e) => {
    e.preventDefault();
    mediumClick();
    try {
      console.log({
        code: promoCode.toUpperCase().trim(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        usage_limit: usageLimit ? parseInt(usageLimit) : null,
        expires_at: expiresAt ? expiresAt : null,
      });
      const res = await api.post(`/api/channels/${channelId}/coupons`, {
        code: promoCode.toUpperCase().trim(),
        discount_type: discountType,
        discount_value: parseFloat(discountValue),
        usage_limit: usageLimit ? parseInt(usageLimit) : null,
        expires_at: expiresAt ? expiresAt : null,
      });

      if (res.data.success) {
        notificationSuccess();
        setIsPromoModalOpen(false);
        setPromoCode("");
        setDiscountValue("");
        setUsageLimit("");
        if (typeof loadData === "function") loadData();
      }
    } catch (err) {
      notificationError();
      tg?.showPopup?.({
        title: "Ошибка",
        message: err.response?.data?.error || "Не удалось создать промокод",
      });
    }
  };

  return {
    promoCode,
    setPromoCode,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    usageLimit,
    setUsageLimit,
    expiresAt,
    setExpiresAt,
    handleCreatePromo,
  };
}
