import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useTelegram } from "../context/TelegramContext.jsx";
import { useHaptic } from "./useHaptic.js";

export function useChannelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const { lightClick, mediumClick, notificationSuccess, notificationError } =
    useHaptic();

  const [channel, setChannel] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [analyticsSummary, setAnalyticsSummary] = useState({
    active_customers_count: 0,
    average_ltv: "0.00",
    total_usdt_earned: "0.00",
    total_stars_earned: "0.00",
    graph_data: [],
  });

  const [promoCodes, setPromoCodes] = useState([]);
  const [giveaways, setGiveaways] = useState([]);

  const [title, setTitle] = useState("");
  const [type, setType] = useState("subscription");
  const [durationDays, setDurationDays] = useState("30");
  const [price, setPrice] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [botTokenInput, setBotTokenInput] = useState("");
  const [isUpdatingBot, setIsUpdatingBot] = useState(false);

  const userLang =
    tg?.initDataUnsafe?.user?.language_code === "en" ? "en" : "ru";

  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isGiveawayModalOpen, setIsGiveawayModalOpen] = useState(false);

  useEffect(() => {
    if (!tg?.BackButton) return;
    const handleGoBack = () => {
      lightClick();
      navigate("/channels", { replace: true });
    };
    tg.BackButton.show();
    tg.BackButton.onClick(handleGoBack);
    return () => tg.BackButton.offClick(handleGoBack);
  }, [tg, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [dashboardRes, servicesRes, promoCodesRes, giveawaysRes] =
        await Promise.all([
          api.get(`/api/channels/${id}`),
          api.get(`/api/channels/${id}/services`),
          api.get(`/api/channels/${id}/coupons`),
          api.get(`/api/channels/${id}/giveaways`),
        ]);

      if (dashboardRes.data?.success) {
        const {
          channel: channelData,
          active_customers_count,
          average_ltv,
          total_usdt_earned,
          total_stars_earned,
          graph_data,
          transactions,
        } = dashboardRes.data;

        setChannel(channelData);

        if (channelData?.bot_token) {
          setBotTokenInput(channelData.bot_token);
        }

        setAnalyticsSummary({
          active_customers_count,
          average_ltv,
          total_usdt_earned,
          total_stars_earned,
          transactions,
          graph_data: graph_data || [],
        });
      }

      setServices(servicesRes.data?.services || []);
      setPromoCodes(promoCodesRes.data?.coupons || []);
      setGiveaways(giveawaysRes.data?.giveaways || []);
    } catch (err) {
      console.error("❌ Ошибка загрузки деталей канала:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateBotToken = async (e) => {
    e.preventDefault();
    setIsUpdatingBot(true);
    mediumClick();
    try {
      const res = await api.post(`/api/channels/${id}/bot`, {
        botToken: botTokenInput,
      });
      if (res.data.success) {
        const updatedChannelData = res.data.channel;
        setChannel({
          ...channel,
          bot_token: updatedChannelData.bot_token,
          bot_username: updatedChannelData.bot_username,
        });
        notificationSuccess();
        tg?.showPopup?.({
          title: "Успех",
          message: "Токен кастомного бота успешно сохранен!",
        });
      }
    } catch (err) {
      notificationError();
      const errorMsg = err.response?.data?.error || "Невалидный токен бота";
      tg?.showPopup?.({ title: "Ошибка", message: errorMsg });
    } finally {
      setIsUpdatingBot(false);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      console.log(type, title, parseInt(durationDays), parseFloat(price));
      const res = await api.post(`/api/channels/${id}/plans`, {
        type,
        title,
        //description: description || "",
        durationDays: type === "subscription" ? parseInt(durationDays) : null,
        price: parseFloat(price),
      });
      console.log(res.data.services);

      if (res.data.success) {
        setServices([...services, res.data.service]);
        console.log(services);
        setIsModalOpen(false);
        setTitle("");
        setPrice("");
        notificationSuccess();
      }
    } catch (err) {
      notificationError();
      const errorMsg =
        err.response?.data?.error || "Ошибка при создании продукта";
      tg?.showPopup?.({ title: "Ошибка", message: errorMsg });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteService = async (serviceId) => {
    mediumClick();
    const executeDelete = async () => {
      try {
        const res = await api.delete(`/api/channels/plan/${serviceId}`);
        if (res.data.success) {
          setServices(services.filter((s) => s.id !== serviceId));
          notificationSuccess();
        }
      } catch (err) {
        notificationError();
        console.error("Ошибка удаления услуги:", err);
      }
    };

    if (tg?.showConfirm) {
      tg.showConfirm(
        "Вы уверены, что хотите удалить этот продукт/тариф?",
        (confirmed) => {
          if (confirmed) executeDelete();
        },
      );
    } else if (
      window.confirm("Вы уверены, что хотите удалить этот продукт/тариф?")
    ) {
      executeDelete();
    }
  };

  const handleCopyLink = () => {
    lightClick();
    const botUser = channel?.bot_username || "SaaSPay_Bot";
    const linkText = `https://t.me/${botUser}/`;
    navigator.clipboard.writeText(linkText);
    tg?.showPopup?.({ message: "Ссылка на витрину скопирована!" });
  };

  const formattedServices = services.map((s) => {
    const netProfit = s.price * 0.97;
    return {
      ...s,
      netProfitFormatted: netProfit.toFixed(2),
    };
  });

  return {
    id,
    loading,
    channel,
    formattedServices,
    isModalOpen,
    promoCodes,
    giveaways,
    analyticsSummary,
    loadData,
    openModal: () => {
      mediumClick();
      setIsModalOpen(true);
    },
    closeModal: () => {
      lightClick();
      setIsModalOpen(false);
    },
    botTokenInput,
    setBotTokenInput,
    isUpdatingBot,
    handleUpdateBotToken,
    handleCopyLink,
    handleDeleteService,
    form: {
      title,
      setTitle,
      type,
      setType,
      durationDays,
      setDurationDays,
      price,
      setPrice,
      formLoading,
      handleCreateService,
    },
    promoForm: {
      isOpen: isPromoModalOpen,
      setIsPromoModalOpen,
      open: () => {
        mediumClick();
        setIsPromoModalOpen(true);
      },
      close: () => {
        lightClick();
        setIsPromoModalOpen(false);
      },
    },
    giveawayForm: {
      isOpen: isGiveawayModalOpen,
      open: () => {
        mediumClick();
        setIsGiveawayModalOpen(true);
      },
      close: () => {
        lightClick();
        setIsGiveawayModalOpen(false);
      },
      setIsGiveawayModalOpen,
    },
  };
}
