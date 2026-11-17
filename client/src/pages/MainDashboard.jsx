import React from "react";
import {
  RectangleStackIcon,
  WalletIcon,
  Cog6ToothIcon,
  ChevronRightIcon,
  GiftIcon,
  TicketIcon,
  ArrowUpTrayIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  SparklesIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import { useDashboard } from "../hooks/useDashboard.js";

const MainDashboard = () => {
  const { user, countChannels, countCustomers, navigateToModule } =
    useDashboard();
  const tg = window.Telegram?.WebApp;

  const handleNavigation = (path) => {
    tg?.HapticFeedback?.impactOccurred("light");
    navigateToModule(path);
  };

  return (
    <div className="min-h-screen bg-tg-secondary-bg text-tg-text font-sans px-1 pb-8 mt-1 select-none antialiased">
      {/* СЕКЦИЯ 1: ПРОФИЛЬ И СТАТУС */}
      <div className="flex items-center justify-between mb-5 px-1">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm text-white shadow-md border-2 border-tg-bg overflow-hidden bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-500">
            {user?.photo_url ? (
              <img
                src={user.photo_url}
                alt={user?.first_name || "Avatar"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}

            <span className={user?.photo_url ? "hidden" : "flex"}>
              {user?.first_name
                ? user.first_name.substring(0, 2).toUpperCase()
                : "AD"}
            </span>
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight text-tg-text flex items-center gap-1.5">
              {user?.first_name || "Администратор"}
            </h1>
            <p className="text-[12px] text-tg-link font-medium">
              @{user?.username || "panel"}
            </p>
          </div>
        </div>
        {user?.is_premium_subscriber && (
          <span className="text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-1 rounded-full font-bold tracking-wide shadow-sm animate-pulse">
            PREMIUM
          </span>
        )}
      </div>

      {/* СЕКЦИЯ 2: ГЛАВНЫЙ БАЛАНС (`users.balance_available` и `balance_hold`) */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-tg-mobile-card tg-desk:rounded-tg-desk-card p-6 mb-5 text-center shadow-lg text-white border-none">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-sky-400/20 rounded-full blur-lg pointer-events-none" />

        <p className="text-[11px] text-blue-100/80 font-bold uppercase tracking-wider mb-1 drop-shadow-sm">
          Ваш баланс (Доступно к выводу)
        </p>
        <h2 className="text-4xl font-black tracking-tight mb-4 drop-shadow-md">
          {parseFloat(user?.balance_available || 0).toFixed(2)}{" "}
          <span className="text-sky-300 font-medium text-2xl">$</span>
        </h2>

        {parseFloat(user?.balance_hold || 0) > 0 && (
          <p className="text-[11px] text-amber-200 bg-white/10 backdrop-blur-md inline-block px-3 py-1 rounded-full font-bold mb-4 shadow-sm border border-white/10">
            ⏱️ В холде: {parseFloat(user?.balance_hold).toFixed(2)} $
          </p>
        )}

        <div className="grid grid-cols-2 gap-2.5 pt-4 border-t border-white/10">
          <button
            onClick={() => handleNavigation("/finance")}
            className="flex items-center justify-center gap-2 bg-white text-blue-700 hover:bg-blue-50 active:scale-95 py-2.5 rounded-tg-mobile-btn tg-desk:rounded-tg-desk-btn text-xs font-black transition-all shadow-md cursor-pointer"
          >
            <ArrowUpTrayIcon className="w-4 h-4 stroke-[3]" />
            Вывести
          </button>
          {/* <button
            //onClick={() => handleNavigation("/finance/stats")}
            onClick={() => handleNavigation("/")}
            className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/20 active:scale-95 py-2.5 rounded-tg-mobile-btn tg-desk:rounded-tg-desk-btn text-xs font-bold transition-all text-white backdrop-blur-sm cursor-pointer"
          >
            <WalletIcon className="w-4 h-4" />
            Статистика
          </button> */}
          <button
            disabled
            className="flex items-center justify-center gap-2 bg-white/5 py-2.5 rounded-tg-mobile-btn tg-desk:rounded-tg-desk-btn text-xs font-bold transition-all text-white/40 backdrop-blur-sm cursor-not-allowed select-none"
          >
            <WalletIcon className="w-4 h-4 opacity-40" />
            Статистика
            <span className="text-[10px] bg-tg-link text-white px-1.5 py-0.5 rounded-full scale-90 font-medium opacity-80">
              Скоро
            </span>
          </button>
        </div>
      </div>

      {/* СЕКЦИЯ 3: ГОРИЗОНТАЛЬНЫЙ СКРОЛЛ (ЭТАПЫ 3 и 7: Маркетинг и Промо) */}
      {/* <p className="text-[12px] text-tg-hint font-bold uppercase tracking-wider px-1 mb-2">
        Быстрый маркетинг
      </p>
      <div className="flex gap-3 overflow-x-auto pb-3 mb-5 scrollbar-none snap-x">
        <div
          onClick={() => handleNavigation("/giveaways")}
          className="snap-center shrink-0 w-[110px] bg-tg-bg p-3.5 rounded-tg-mobile-card tg-desk:rounded-tg-desk-card border border-tg-hint/10 flex flex-col items-center text-center cursor-pointer active:scale-95 transition-all shadow-sm"
        >
          <div className="w-11 h-11 rounded-full bg-orange-500 text-white flex items-center justify-center mb-2 shadow-md shadow-orange-500/20 bg-gradient-to-b from-orange-400 to-orange-600">
            <GiftIcon className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[12px] font-bold tracking-tight text-tg-text">
            Розыгрыши
          </span>
        </div>

        <div
          onClick={() => handleNavigation("/promocodes")}
          className="snap-center shrink-0 w-[110px] bg-tg-bg p-3.5 rounded-tg-mobile-card tg-desk:rounded-tg-desk-card border border-tg-hint/10 flex flex-col items-center text-center cursor-pointer active:scale-95 transition-all shadow-sm"
        >
          <div className="w-11 h-11 rounded-full bg-purple-500 text-white flex items-center justify-center mb-2 shadow-md shadow-purple-500/20 bg-gradient-to-b from-purple-400 to-purple-600">
            <TicketIcon className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[12px] font-bold tracking-tight text-tg-text">
            Промокоды
          </span>
        </div>
        <div
          onClick={() => handleNavigation("/marketing")}
          className="snap-center shrink-0 w-[110px] bg-tg-bg p-3.5 rounded-tg-mobile-card tg-desk:rounded-tg-desk-card border border-tg-hint/10 flex flex-col items-center text-center cursor-pointer active:scale-95 transition-all shadow-sm"
        >
          <div className="w-11 h-11 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-md shadow-emerald-500/20 bg-gradient-to-b from-emerald-400 to-emerald-600">
            <RectangleStackIcon className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[12px] font-bold tracking-tight text-tg-text">
            UTM-Ссылки
          </span>
        </div>
      </div> */}

      {/* НОВАЯ СЕКЦИЯ 4: УПРАВЛЕНИЕ ДОХОДОМ (ЭТАП 4: `platform_services`) */}
      {/* <p className="text-[12px] text-tg-hint font-bold uppercase tracking-wider px-1 mb-2">
        Монетизация контента
      </p>
      <div className="bg-tg-bg rounded-tg-mobile-card tg-desk:rounded-tg-desk-card overflow-hidden border border-tg-hint/10 mb-5 shadow-sm">
        <div
          onClick={() => handleNavigation("/services")}
          className="flex items-center justify-between px-4 py-3.5 active:bg-tg-secondary-bg transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shadow-sm">
              <SparklesIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-sm font-semibold text-tg-text block leading-tight">
                Платные услуги
              </span>
              <span className="text-[11px] text-tg-hint">
                Подписки, донаты, чаты
              </span>
            </div>
          </div>
          <ChevronRightIcon className="w-4 h-4 text-tg-hint/40" />
        </div>
      </div> */}

      {/* СЕКЦИЯ 5: НАВЫШНЫЙ СПИСОК (ЭТАПЫ 2, 5: Каналы, CRM, Команда) */}
      <p className="text-[12px] text-tg-hint font-bold uppercase tracking-wider px-1 mb-2">
        Управление проектом
      </p>
      <div className="bg-tg-bg rounded-tg-mobile-card tg-desk:rounded-tg-desk-card overflow-hidden border border-tg-hint/10 mb-5 shadow-sm">
        {/* Строка 1: Мои каналы (`channels`) */}
        <div
          onClick={() => navigateToModule("/channels")}
          className="flex items-center justify-between px-4 py-3.5 active:bg-tg-secondary-bg transition-all cursor-pointer border-b border-tg-secondary-bg"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-sm">
              <RectangleStackIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-sm font-semibold text-tg-text">
              Подключенные ресурсы
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs bg-tg-link text-white px-2 py-0.5 rounded-full font-bold shadow-sm">
              {countChannels || 0}
            </span>
            <ChevronRightIcon className="w-4 h-4 text-tg-hint/40" />
          </div>
        </div>

        {/* Строка 2: CRM Клиенты (`channel_customers`) */}
        {/* <div
          onClick={() => handleNavigation("/customers")}
          className="flex items-center justify-between px-4 py-3.5 active:bg-tg-secondary-bg transition-all cursor-pointer border-b border-tg-secondary-bg"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500 text-white flex items-center justify-center shadow-sm">
              <UserGroupIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-sm font-semibold text-tg-text">
              Клиенты и LTV слой
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {countCustomers > 0 && (
              <span className="text-xs bg-tg-secondary-bg text-tg-hint px-2 py-0.5 rounded-full font-medium">
                {countCustomers}
              </span>
            )}
            <ChevronRightIcon className="w-4 h-4 text-tg-hint/40" />
          </div>
        </div>

        <div
          onClick={() => handleNavigation("/managers")}
          className="flex items-center justify-between px-4 py-3.5 active:bg-tg-secondary-bg transition-all cursor-pointer border-b border-tg-secondary-bg"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <ShieldCheckIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-sm font-semibold text-tg-text">
              Команда и доступы
            </span>
          </div>
          <ChevronRightIcon className="w-4 h-4 text-tg-hint/40" />
        </div>

        <div
          onClick={() => handleNavigation("/landing-settings")}
          className="flex items-center justify-between px-4 py-3.5 active:bg-tg-secondary-bg transition-all cursor-pointer border-b border-tg-secondary-bg"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-pink-500 text-white flex items-center justify-center shadow-sm">
              <GlobeAltIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-sm font-semibold text-tg-text">
              Настройка витрины
            </span>
          </div>
          <ChevronRightIcon className="w-4 h-4 text-tg-hint/40" />
        </div>

        <div
          onClick={() => handleNavigation("/settings")}
          className="flex items-center justify-between px-4 py-3.5 active:bg-tg-secondary-bg transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-zinc-500 dark:bg-zinc-600 text-white flex items-center justify-center shadow-sm">
              <Cog6ToothIcon className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-sm font-semibold text-tg-text">
              Конфигурация системы
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-bold font-mono text-tg-hint/70 bg-tg-secondary-bg px-1.5 py-0.5 rounded">
              v1.0.0
            </span>
            <ChevronRightIcon className="w-4 h-4 text-tg-hint/60" />
          </div>
        </div> */}
      </div>

      {/* ИНФОРМАЦИОННЫЙ СУППОРТ БАННЕР */}
      <div className="bg-tg-bg p-4 rounded-tg-mobile-card tg-desk:rounded-tg-desk-card border border-tg-hint/10 text-center shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-tg-link" />
        <p className="text-[11px] text-tg-hint font-medium">
          Нужна помощь или возникли вопросы?
        </p>
        <a
          href="https://t.me/accessbotmanager"
          target="_blank"
          rel="noreferrer"
          className="text-xs text-tg-link font-bold mt-1 inline-block hover:underline bg-tg-link/10 px-3 py-1 rounded-full"
        >
          👨‍💻 Поддержка: @accessbotmanager
        </a>
      </div>
    </div>
  );
};

export default MainDashboard;
