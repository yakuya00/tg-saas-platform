import { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "../api/axios.js";
import { useTelegram } from "../context/TelegramContext.jsx";
import { useHaptic } from "./useHaptic.js";

export function useClientPay() {
  const { channelId } = useParams();
  const { tg } = useTelegram();
  const { lightClick, mediumClick, notificationSuccess, notificationError } =
    useHaptic();

  const [channelTitle, setChannelTitle] = useState("Загрузка...");
  const [tariffs, setTariffs] = useState([]);

  const [activeCategory, setActiveCategory] = useState(""); // 'subscription' | 'digital_product' | 'donate' | 'paid_chat'
  const [selectedTariff, setSelectedTariff] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("crypto_bot"); // 'crypto_bot' | 'tg_stars' | 'ton_connect'

  const [loading, setLoading] = useState(true);
  const [payLoading, setPayLoading] = useState(false);

  const userLang =
    tg?.initDataUnsafe?.user?.language_code === "en" ? "en" : "ru";
  const userTgId = tg?.initDataUnsafe?.user?.id || 12345;

  useEffect(() => {
    const fetchTariffs = async () => {
      try {
        const res = await api.get(`/api/channels/public/${channelId}/tariffs`);
        const activeTariffs = res.data.tariffs || [];
        setTariffs(activeTariffs);
        setChannelTitle(res.data.channelTitle);

        if (activeTariffs.length > 0) {
          const firstTariffType = activeTariffs[0].type;
          setActiveCategory(firstTariffType);
          setSelectedTariff(activeTariffs[0].id);
        }
      } catch (err) {
        console.error("Ошибка загрузки публичных тарифов витрины:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTariffs();
  }, [channelId]);

  const availableCategories = useMemo(() => {
    const types = tariffs.map((t) => t.type);
    return [...new Set(types)];
  }, [tariffs]);

  const filteredTariffs = useMemo(() => {
    return tariffs.filter((t) => t.type === activeCategory);
  }, [tariffs, activeCategory]);

  const handleSelectCategory = (category) => {
    lightClick();
    setActiveCategory(category);

    const firstOfNewCategory = tariffs.find((t) => t.type === category);
    if (firstOfNewCategory) {
      setSelectedTariff(firstOfNewCategory.id);

      if (firstOfNewCategory.currency_code === "STARS") {
        setPaymentMethod("tg_stars");
      } else {
        setPaymentMethod("crypto_bot");
      }
    }
  };

  const handleSelectTariff = (tariffId) => {
    lightClick();
    setSelectedTariff(tariffId);

    const target = tariffs.find((t) => t.id === tariffId);
    if (target?.currency_code === "STARS") {
      setPaymentMethod("tg_stars");
    }
  };

  const handleSelectPaymentMethod = (method) => {
    lightClick();
    setPaymentMethod(method);
  };

  const handlePayment = async () => {
    if (!selectedTariff) return;
    mediumClick();
    setPayLoading(true);

    const gatewayCode =
      paymentMethod === "tg_stars" ? "tg_stars" : paymentMethod;

    try {
      const res = await api.post("/api/payments/create", {
        userTgId: userTgId,
        tariffId: selectedTariff,
        gatewayCode: gatewayCode,
      });

      if (res.data.payUrl) {
        notificationSuccess();
        if (tg) {
          if (tg.openTelegramLink) {
            tg.openTelegramLink(res.data.payUrl);
          } else {
            tg.openLink(res.data.payUrl);
          }
        } else {
          window.location.href = res.data.payUrl;
        }
      }
    } catch (err) {
      notificationError();
      console.error("Крах при генерации платежного инвойса:", err.message);
      if (tg?.showPopup) {
        tg.showPopup({
          title: "Ошибка",
          message: "Не удалось создать счет. Попробуйте другой способ.",
        });
      } else {
        alert("Не удалось создать счет для оплаты.");
      }
    } finally {
      setPayLoading(false);
    }
  };

  const getCurrencyName = (currencyObj) => {
    if (!currencyObj) return "";
    const nameJson =
      typeof currencyObj === "string" ? JSON.parse(currencyObj) : currencyObj;
    return nameJson[userLang] || nameJson["ru"];
  };

  const activeTariffObj = tariffs.find((t) => t.id === selectedTariff);
  const priceRaw = Number(activeTariffObj?.price || 0);
  let totalWithFee;
  if (paymentMethod === "crypto_bot") {
    totalWithFee = Math.round((priceRaw / 0.97) * 100) / 100;
  } else {
    totalWithFee = priceRaw / 0.95;
  }
  const feeCalculated = (totalWithFee - priceRaw).toFixed(2);

  return {
    loading,
    payLoading,
    channelTitle,
    availableCategories,
    activeCategory,
    filteredTariffs,
    selectedTariff,
    paymentMethod,
    cryptoDetails: {
      price: priceRaw.toFixed(2),
      fee: feeCalculated,
      total: totalWithFee.toFixed(2),
    },
    handleSelectCategory,
    handleSelectTariff,
    handleSelectPaymentMethod,
    handlePayment,
    getCurrencyName,
  };
}
