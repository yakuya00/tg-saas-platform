import React, { useState } from "react";
import api from "../api/axios.js";

const WithdrawForm = ({ channel, onWithdrawSuccess }) => {
  const [currency, setCurrency] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleWithdraw = async (e) => {
    e.preventDefault();

    const withdrawAmount = parseFloat(amount);
    if (!withdrawAmount || withdrawAmount <= 0) {
      return setMessage({ type: "error", text: "Введите корректную сумму" });
    }

    if (withdrawAmount < 5) {
      return setMessage({
        type: "error",
        text: "Минимальный вывод: $5.00 USDT",
      });
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await api.post("/api/finance/withdraw/request", {
        channelId: channel.id,
        amount: withdrawAmount,
        currency: currency,
      });

      if (response.data.success) {
        setMessage({ type: "success", text: response.data.message });
        setAmount("");

        if (onWithdrawSuccess) onWithdrawSuccess();

        window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred(
          "success",
        );
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.error || "Ошибка при выводе средств";
      setMessage({ type: "error", text: errorMsg });

      window.Telegram?.WebApp?.HapticFeedback?.notificationOccurred("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#1c1c1e] border border-zinc-850 p-5 rounded-2xl mt-4 text-white">
      <h3 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider mb-4">
        💸 Быстрый автовывод средств
      </h3>

      <form onSubmit={handleWithdraw} className="space-y-4">
        {/* Выбор баланса для вывода */}
        <div>
          <label className="text-[11px] text-zinc-500 uppercase block mb-1.5 font-bold tracking-wide">
            Выберите источник баланса
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setCurrency("USDT");
                setMessage({ type: "", text: "" });
              }}
              className={`p-2.5 rounded-xl border text-xs font-medium transition ${
                currency === "USDT"
                  ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400"
              }`}
            >
              Крипто-баланс (${parseFloat(channel.balance_usdt || 0).toFixed(2)}
              )
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrency("STARS");
                setMessage({ type: "", text: "" });
              }}
              className={`p-2.5 rounded-xl border text-xs font-medium transition ${
                currency === "STARS"
                  ? "bg-amber-500/10 border-amber-500 text-amber-400"
                  : "bg-zinc-900 border-zinc-800 text-zinc-400"
              }`}
            >
              Баланс Звёзд ($
              {parseFloat(channel.stars_available || 0).toFixed(2)})
            </button>
          </div>
        </div>

        {/* Поле ввода суммы */}
        <div>
          <label className="text-[11px] text-zinc-500 uppercase block mb-1 font-bold tracking-wide">
            Сумма вывода (в долларах)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Мин. 5"
              disabled={loading}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-700 transition"
            />
            <span className="absolute right-3 top-3 text-xs font-semibold text-zinc-500">
              USDT
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-[11px] text-zinc-400 leading-normal space-y-1">
          <p className="text-blue-400 font-bold">
            ℹ️ Регламент моментальных выплат:
          </p>
          {currency === "STARS" ? (
            <>
              <p>
                • Средства, заработанные на Звёздах, выводятся в валюте{" "}
                <b>USDT</b> один к одному.
              </p>
              <p>
                • Никаких скрытых комиссий при выводе нет (3% платформы
                удерживаются сразу при покупке тарифа).
              </p>
              <p>
                • Зачисление на ваш кошелёк в <b>@CryptoBot</b> происходит
                моментально.
              </p>
            </>
          ) : (
            <>
              <p>
                • Вывод доступных средств с прямых крипто-продаж в валюте{" "}
                <b>USDT</b>.
              </p>
              <p>
                • Автоматический мгновенный перевод напрямую на ваш аккаунт в{" "}
                <b>@CryptoBot</b>.
              </p>
              <p>
                • Транзакция выполняется в автоматическом режиме без задержек.
              </p>
            </>
          )}
        </div>

        {message.text && (
          <div
            className={`p-3 rounded-xl text-xs border ${
              message.type === "success"
                ? "bg-emerald-950/30 border-emerald-900/50 text-emerald-400"
                : "bg-rose-950/30 border-rose-900/50 text-rose-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Главная кнопка отправки */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold p-3 rounded-xl text-sm transition shadow-lg shadow-blue-600/10 active:scale-[0.99]"
        >
          {loading ? "Обработка транзакции..." : "Вывести моментально в USDT"}
        </button>
      </form>
    </div>
  );
};

export default WithdrawForm;
