import React, { useState } from "react";
import {
  BanknotesIcon,
  ClockIcon,
  CheckCircleIcon,
  ArrowUpRightIcon,
  XMarkIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useFinance } from "../hooks/useFinance.js";

const AdminFinance = () => {
  const { loading, balances, transactions, requestWithdrawal } = useFinance();

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-tg-secondary-bg">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-tg-link border-b-transparent"></div>
      </div>
    );
  }

  const availableToWithdraw = parseFloat(balances?.available || 0);
  const inHoldUSD = parseFloat(balances?.inHold || 0);

  const totalBalanceUSD = parseFloat(balances?.totalEarned || 0).toFixed(2);

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setWithdrawError("");

    const numAmount = parseFloat(withdrawAmount);
    if (isNaN(numAmount) || numAmount < 5) {
      setWithdrawError("Минимальная сумма вывода — $5.00");
      return;
    }

    if (numAmount > availableToWithdraw) {
      setWithdrawError("Недостаточно средств на доступном балансе");
      return;
    }

    try {
      setIsSubmitting(true);
      await requestWithdrawal(numAmount);

      setWithdrawAmount("");
      setIsWithdrawModalOpen(false);
      if (window.Telegram?.WebApp?.showAlert) {
        window.Telegram.WebApp.showAlert(
          "🚀 Заявка на вывод отправлена на модерацию!",
        );
      } else {
        alert("🚀 Заявка на вывод отправлена на модерацию!");
      }
    } catch (err) {
      console.log(err);
      setWithdrawError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-150 bg-tg-secondary-bg min-h-screen text-tg-text p-4 space-y-5 pb-16 select-none">
      {/* ШАПКА СТРАНИЦЫ */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-[16px] font-bold text-tg-text">
            Финансы платформы
          </h2>
          <p className="text-[11px] text-tg-hint">
            Общий баланс и история операций в <b>USD</b>
          </p>
        </div>

        {/* Кнопка вызова вывода */}
        <button
          onClick={() => {
            window.Telegram?.WebApp?.HapticFeedback?.impactOccurred("light");
            setIsWithdrawModalOpen(true);
          }}
          disabled={availableToWithdraw <= 0}
          className="bg-tg-button text-tg-button-text disabled:opacity-40 text-[13px] font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 active:opacity-90 transition-all cursor-pointer shadow-sm"
        >
          <ArrowUpRightIcon className="w-4 h-4 stroke-[2.5]" />
          Вывести
        </button>
      </div>

      {/* ВИДЖЕТ ОБЩЕГО БАЛАНСА */}
      <div className="bg-tg-bg border border-tg-hint/10 p-4 rounded-xl space-y-4 shadow-sm">
        <div className="space-y-0.5">
          <span className="text-tg-hint text-[11px] font-bold uppercase tracking-wider block">
            Ваш совокупный доход
          </span>
          <span className="text-3xl font-black text-tg-text tracking-tight block">
            ${totalBalanceUSD}
          </span>
        </div>

        <div className="border-t border-tg-hint/5" />

        {/* Сплит: Холд vs Доступно */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-tg-secondary-bg border border-tg-hint/5 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-tg-hint text-[10px] font-bold uppercase">
              <ClockIcon className="w-3.5 h-3.5" />
              <span>В холде</span>
            </div>
            <p className="text-lg font-bold text-tg-text mt-1">
              ${inHoldUSD.toFixed(2)}
            </p>
          </div>

          <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-bold uppercase">
              <CheckCircleIcon className="w-3.5 h-3.5" />
              <span>Доступно</span>
            </div>
            <p className="text-lg font-extrabold text-emerald-500 mt-1">
              ${availableToWithdraw.toFixed(2)}
            </p>
          </div>
        </div>

        {inHoldUSD > 0 && (
          <div className="p-3 rounded-xl bg-tg-secondary-bg border border-tg-hint/10 text-[11px] text-tg-hint leading-snug animate-in fade-in duration-200">
            ℹ️ Часть средств удерживается в заморозке безопасности до 21 дня
            согласно правилам Telegram API. Они станут доступны автоматически.
          </div>
        )}
      </div>

      {/* СПИСОК ТРАНЗАКЦИЙ */}
      <div className="space-y-2">
        <h3 className="text-[11px] text-tg-hint font-bold uppercase tracking-wider px-1">
          История выводов
        </h3>

        <div className="bg-tg-bg border border-tg-hint/10 rounded-xl overflow-hidden shadow-sm">
          {transactions.length === 0 ? (
            <p className="text-tg-hint text-xs py-6 text-center">
              История выплат пуста
            </p>
          ) : (
            transactions.map((tx, index) => (
              <div
                key={tx.payment_id}
                className={`flex items-center justify-between py-3.5 pr-3 ml-4 ${
                  index !== transactions.length - 1
                    ? "border-b border-tg-hint/10"
                    : ""
                }`}
              >
                <div>
                  <p className="text-[13px] font-bold text-tg-text">
                    {tx.channel_title || "Вывод средств"}
                  </p>
                  <p className="text-[10px] text-tg-hint mt-0.5">
                    {tx.dateFormatted} в {tx.timeFormatted}
                  </p>
                </div>
                <div className="text-right flex flex-col items-end pr-1">
                  <p className="text-[13px] font-black text-tg-text">
                    ${parseFloat(tx.amount_formatted).toFixed(2)}
                  </p>
                  <p
                    className={`text-[9px] uppercase mt-0.5 font-bold ${
                      tx.status === "success"
                        ? "text-emerald-500"
                        : tx.status === "failed"
                          ? "text-red-500"
                          : "text-amber-500"
                    }`}
                  >
                    {tx.status === "success"
                      ? "✅ Готов"
                      : tx.status === "failed"
                        ? "❌ Отклонен"
                        : "⏳ В обработке"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 animate-in fade-in duration-200">
          <div
            className="absolute inset-0"
            onClick={() => setIsWithdrawModalOpen(false)}
          />
          <div className="bg-tg-bg w-full rounded-t-3xl border-t border-tg-hint/10 p-5 pb-8 shadow-2xl relative animate-in slide-in-from-bottom-25 duration-300 text-left">
            <div className="w-10 h-1.5 bg-tg-hint/20 rounded-full mx-auto mb-4 -mt-1" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-tg-text">
                <BanknotesIcon className="w-5 h-5 text-emerald-500" />
                <h3 className="font-bold text-[16px]">Вывод заработка</h3>
              </div>
              <button
                onClick={() => setIsWithdrawModalOpen(false)}
                className="text-[14px] font-bold text-tg-link cursor-pointer"
              >
                Отмена
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider text-tg-hint mb-1 pl-1">
                  <label>Сумма вывода ($)</label>
                  <span
                    onClick={() =>
                      setWithdrawAmount(availableToWithdraw.toFixed(2))
                    }
                    className="text-tg-link cursor-pointer hover:underline"
                  >
                    Всего: ${availableToWithdraw.toFixed(2)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-23/50 -translate-y-1/2 text-tg-hint font-bold text-[13px]">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="5"
                    max={availableToWithdraw}
                    required
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-tg-secondary-bg border border-tg-hint/10 rounded-xl py-3 pl-7 pr-4 text-[13px] text-tg-text font-bold font-mono focus:outline-none focus:border-tg-link shadow-inner"
                  />
                </div>
                <p className="text-[10px] text-tg-hint mt-1 pl-1">
                  * Минимальная сумма для заказа выплаты составляет{" "}
                  <b className="text-tg-text">$5.00</b>
                </p>
              </div>

              {/* Поле Ввода Реквизитов */}
              {/* <div>
                <label className="block text-[11px] font-bold text-tg-hint uppercase tracking-wider mb-1 pl-1">
                  Адрес кошелька USDT (TRC-20 / TON)
                </label>
                <input
                  type="text"
                  required
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  placeholder="Введите адрес кошелька..."
                  className="w-full bg-tg-secondary-bg border border-tg-hint/10 rounded-xl px-3.5 py-3 text-[13px] text-tg-text font-mono focus:outline-none focus:border-tg-link shadow-inner"
                />
              </div> */}

              {/* Вывод ошибок валидации */}
              {withdrawError && (
                <p className="text-[11px] font-semibold text-red-500 bg-red-500/5 border border-red-500/10 p-2.5 rounded-xl animate-in fade-in">
                  ⚠️ {withdrawError}
                </p>
              )}

              {/* Плашка безопасности обработки */}
              <div className="flex gap-2 p-3 rounded-xl bg-tg-secondary-bg border border-tg-hint/10 text-[11px] text-tg-hint leading-snug animate-in fade-in">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  Выплаты отправляются{" "}
                  <b className="text-emerald-500">моментально</b> прямо в ваш
                  Crypto Bot. В случае сетевых сбоев заявка передается на ручную
                  проверку в финансовый отдел (обработка до 24 часов).
                </span>
              </div>
              {/* Кнопка создания заявки */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-tg-button text-tg-button-text py-3.5 rounded-xl text-[14px] font-bold shadow-md transition-all active:scale-[0.99] flex items-center justify-center min-h-[44px] cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-tg-button-text border-b-transparent"></div>
                ) : (
                  "Подтвердить вывод"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinance;
