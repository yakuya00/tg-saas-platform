import React from "react";
import { useClientPay } from "../hooks/useClientPay.js";
import {
  CheckIcon,
  CreditCardIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const ClientPay = () => {
  const {
    loading,
    payLoading,
    channelTitle,
    availableCategories,
    activeCategory,
    filteredTariffs,
    selectedTariff,
    paymentMethod,
    cryptoDetails,
    handleSelectCategory,
    handleSelectTariff,
    handleSelectPaymentMethod,
    handlePayment,
  } = useClientPay();

  const categoryNames = {
    subscription: "Подписки",
    digital_product: "Товары",
    paid_chat: "Консультации",
    donate: "Донаты",
  };

  return (
    <div className="min-h-screen bg-tg-secondary-bg text-tg-text font-sans p-4 select-none pb-12 animate-in fade-in duration-150">
      {/* ШАПКА КАНАЛА-ПРОДАВЦА */}
      <div className="text-center space-y-2 my-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-tg-link to-indigo-500 mx-auto flex items-center justify-center text-white font-black text-xl shadow-md border-4 border-tg-bg">
          {channelTitle?.[0]?.toUpperCase()}
        </div>
        <h2 className="text-xl font-black tracking-tight text-tg-text">
          {channelTitle}
        </h2>
        <p className="text-xs text-tg-hint max-w-xs mx-auto leading-snug">
          Официальная витрина монетизации приватного контента проекта
        </p>
      </div>

      {/* ====================================================================
          ШАГ 1: ТАБЫ КАТЕГОРИЙ
          ==================================================================== */}
      {availableCategories.length > 1 && (
        <div className="mb-5">
          <div className="bg-tg-bg border border-tg-hint/10 p-0.5 rounded-xl flex shadow-sm">
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleSelectCategory(cat)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${activeCategory === cat ? "bg-tg-secondary-bg text-tg-link shadow-sm" : "text-tg-hint"}`}
              >
                {categoryNames[cat] || cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          ШАГ 2: СЕТКА С ТАРИФАМИ ФИЛЬТРОВАННОЙ КАТЕГОРИИ
          ==================================================================== */}
      <div className="space-y-2.5 mb-6">
        <p className="text-[11px] text-tg-hint font-bold uppercase tracking-wider px-1">
          Выберите тарифный план
        </p>

        {filteredTariffs.length === 0 ? (
          <div className="bg-tg-bg p-6 text-center rounded-xl border border-tg-hint/10 text-xs text-tg-hint">
            В этой категории пока нет активных позиций.
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredTariffs.map((tariff) => {
              const isSelected = selectedTariff === tariff.id;
              return (
                <div
                  key={tariff.id}
                  onClick={() => handleSelectTariff(tariff.id)}
                  className={`bg-tg-bg p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between shadow-sm relative overflow-hidden ${isSelected ? "border-tg-link ring-1 ring-tg-link/30" : "border-tg-hint/10 hover:border-tg-hint/20"}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? "bg-tg-link border-tg-link text-white" : "border-tg-hint/30"}`}
                    >
                      {isSelected && (
                        <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-[14px] text-tg-text leading-tight">
                        {tariff.title}
                      </h4>
                      {tariff.duration_days && (
                        <p className="text-[11px] text-tg-hint mt-0.5">
                          Доступ на {tariff.duration_days} дней
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[15px] font-black text-tg-text">
                      ${Number(tariff.price).toFixed(2)}
                    </span>
                    <p className="text-[9px] text-tg-hint font-bold uppercase tracking-wide">
                      {tariff.currency_code}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ====================================================================
          ШАГ 3: СПОСОБЫ ОПЛАТЫ
          ==================================================================== */}
      <div className="space-y-2.5 mb-6">
        <p className="text-[11px] text-tg-hint font-bold uppercase tracking-wider px-1">
          Способ оплаты счета
        </p>

        <div className="bg-tg-bg border border-tg-hint/10 rounded-xl overflow-hidden shadow-sm">
          {/* Вариант 1: Crypto Bot */}
          <div
            onClick={() => handleSelectPaymentMethod("crypto_bot")}
            className={`flex items-center justify-between p-3.5 ml-4 border-b border-tg-hint/10 cursor-pointer active:bg-tg-secondary-bg pr-4`}
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                ₿
              </div>
              <span className="text-xs font-bold text-tg-text">
                Crypto Pay (USDT)
              </span>
            </div>
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${paymentMethod === "crypto_bot" ? "border-tg-link bg-tg-link" : "border-tg-hint/30"}`}
            >
              {paymentMethod === "crypto_bot" && (
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </div>
          </div>

          {/* Вариант 2: Telegram Stars */}
          <div
            onClick={() => handleSelectPaymentMethod("tg_stars")}
            className={`flex items-center justify-between p-3.5 ml-4 border-b border-tg-hint/10 cursor-pointer active:bg-tg-secondary-bg pr-4`}
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-sm">
                ⭐️
              </div>
              <span className="text-xs font-bold text-tg-text">
                Telegram Stars (Звёзды)
              </span>
            </div>
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${paymentMethod === "tg_stars" ? "border-tg-link bg-tg-link" : "border-tg-hint/30"}`}
            >
              {paymentMethod === "tg_stars" && (
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </div>
          </div>

          {/* Вариант 3: Нативный TON Connect */}
          {/* <div
            onClick={() => handleSelectPaymentMethod("ton_connect")}
            className={`flex items-center justify-between p-3.5 ml-4 cursor-pointer active:bg-tg-secondary-bg pr-4`}
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-sky-500 text-white flex items-center justify-center shadow-sm">
                💎
              </div>
              <span className="text-xs font-bold text-tg-text">
                TON Connect (Tonkeeper / MyTonWallet)
              </span>
            </div>
            <div
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${paymentMethod === "ton_connect" ? "border-tg-link bg-tg-link" : "border-tg-hint/30"}`}
            >
              {paymentMethod === "ton_connect" && (
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </div>
          </div> */}
        </div>
      </div>

      {/* ====================================================================
          ФИНАЛЬНЫЙ ЧЕК И КНОПКА ПОДТВЕРЖДЕНИЯ СДЕЛКИ
          ==================================================================== */}
      <div className="bg-tg-bg border border-tg-hint/10 p-4 rounded-xl space-y-3 shadow-sm mb-4">
        <div className="flex justify-between items-center text-xs text-tg-hint">
          <span>Стоимость позиции:</span>
          <span className="font-bold font-mono text-tg-text">
            ${cryptoDetails.price}
          </span>
        </div>
        <div className="flex justify-between items-center text-xs text-tg-hint">
          <span>Шлюзовая комиссия сети:</span>
          <span className="font-bold font-mono text-tg-text">
            ${cryptoDetails.fee}
          </span>
        </div>
        <div className="h-px bg-tg-hint/10" />
        <div className="flex justify-between items-center text-sm">
          <span className="font-bold text-tg-text">Итого к оплате:</span>
          <span className="font-black font-mono text-tg-link text-base">
            ${cryptoDetails.total}
          </span>
        </div>
      </div>

      <button
        onClick={handlePayment}
        disabled={payLoading || filteredTariffs.length === 0}
        className="w-full bg-tg-button text-tg-button-text py-3.5 rounded-xl text-[15px] font-bold shadow-md active:opacity-90 transition-all flex items-center justify-center min-h-[48px] cursor-pointer disabled:opacity-50"
      >
        {payLoading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-tg-button-text border-b-transparent"></div>
        ) : (
          `Оплатить счет через ${paymentMethod === "crypto_bot" ? "Crypto Pay" : paymentMethod === "tg_stars" ? "Stars" : "TON Connect"}`
        )}
      </button>
    </div>
  );
};

export default ClientPay;
