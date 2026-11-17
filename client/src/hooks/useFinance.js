import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios.js";
import { useTelegram } from "../context/TelegramContext.jsx";
import { useHaptic } from "./useHaptic.js";

export function useFinance() {
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const { lightClick } = useHaptic();

  const [stats, setStats] = useState({
    totalUsdt: 0,
    totalEarned: 0,
    inHold: 0,
    available: 0,
  });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const fetchFinanceData = async () => {
    try {
      const res = await api.get("/api/finance/stats");
      if (res.data.success) {
        setStats(res.data.balances);
        setTransactions(res.data.transactions || []);
      }
    } catch (err) {
      console.error("Ошибка загрузки финансов:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const requestWithdrawal = async (amount) => {
    try {
      const res = await api.post("/api/finance/withdraw/request", {
        amount: parseFloat(amount),
      });

      if (res.data.success) {
        if (typeof successNotification === "function") successNotification();

        await fetchFinanceData();
        return true;
      } else {
        throw new Error(
          res.data.message || "Не удалось создать заявку на вывод",
        );
      }
    } catch (err) {
      console.error("Крах при отправке заявки на вывод:", err);
      const serverMessage =
        err.response?.message || "Ошибка сервера при выводе. Попробуйте позже.";
      throw serverMessage;
    }
  };

  const formattedBalances = {
    totalUsdt: Number(stats.totalUsdt || 0).toFixed(2),
    totalEarned: Number(stats.totalEarned || 0).toFixed(2),
    inHold: Number(stats.inHold || 0).toFixed(2),
    available: Number(stats.available || 0).toFixed(2),
    hasHold: Number(stats.inHold) > 0,
  };

  const formattedTransactions = transactions.map((tx) => {
    const dateObj = new Date(tx.created_at);
    return {
      ...tx,
      amountFormatted: Number(tx.amount || 0).toFixed(2),
      dateFormatted: dateObj.toLocaleDateString(),
      timeFormatted: dateObj.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isHold:
        tx.currency_code === "STARS" && new Date(tx.available_at) > new Date(),
    };
  });

  return {
    loading,
    balances: formattedBalances,
    transactions: formattedTransactions,
    requestWithdrawal,
  };
}
