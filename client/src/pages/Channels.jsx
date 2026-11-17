import React, { useState } from "react";
import {
  PlusIcon,
  XMarkIcon,
  TvIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useChannels } from "../hooks/useChannels.js";

const Channels = () => {
  const {
    channels,
    isModalOpen,
    refreshing,
    handleRefresh,
    openModal,
    closeModal,
    confirmModal,
    navigateToChannel,
  } = useChannels();

  const [activeTab, setActiveTab] = useState("channel");

  return (
    <div className="space-y-4 animate-in fade-in duration-200 select-none bg-tg-secondary-bg text-tg-text font-sans pb-8 antialiased">
      {/* ЗАГОЛОВОК И КНОПКА ПОДКЛЮЧЕНИЯ */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-lg font-bold text-tg-text">Мои каналы</h2>
          <p className="text-xs text-tg-hint">
            Управление приватными пространствами
          </p>
        </div>

        <button
          onClick={openModal}
          className="bg-tg-button text-tg-button-text active:opacity-90 transition-all px-3 py-2 rounded-tg-mobile-btn tg-desk:rounded-tg-desk-btn text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <PlusIcon className="w-4 h-4 stroke-[2.5]" /> Подключить
        </button>
      </div>

      {/* КНОПКА СИНХРОНИЗАЦИИ */}
      {channels.length > 0 && (
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="w-full text-center py-2.5 bg-tg-bg border border-tg-hint/10 rounded-tg-mobile-btn tg-desk:rounded-tg-desk-btn text-xs text-tg-link active:opacity-80 transition-all font-bold cursor-pointer shadow-sm"
        >
          {refreshing
            ? "🔄 Обновление списка..."
            : "🔄 Обновить список каналов"}
        </button>
      )}

      {/* СПИСОК КАНАЛОВ ИЛИ ЗАГЛУШКА */}
      {channels.length === 0 ? (
        <div className="bg-tg-bg border border-tg-hint/10 p-8 rounded-tg-mobile-card tg-desk:rounded-tg-desk-card text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-tg-secondary-bg rounded-full flex items-center justify-center text-tg-hint mx-auto shadow-inner">
            <TvIcon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-tg-text">
              У вас нет подключенных каналов
            </h3>
            <p className="text-xs text-tg-hint max-w-xs mx-auto mt-1 leading-normal">
              Добавьте бота в канал и перешлите пост, чтобы подключить его.
            </p>
          </div>
          <button
            onClick={openModal}
            className="mx-auto bg-tg-secondary-bg text-tg-text text-xs px-4 py-2 rounded-tg-mobile-btn tg-desk:rounded-tg-desk-btn border border-tg-hint/10 active:scale-95 transition-transform font-semibold cursor-pointer"
          >
            Инструкция по подключению
          </button>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {channels.map((channel) => (
            <div
              key={channel.id}
              onClick={() => navigateToChannel(channel.id)}
              className="bg-tg-bg border border-tg-hint/10 p-4 rounded-tg-mobile-card tg-desk:rounded-tg-desk-card flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all shadow-sm group"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-tg-link/20 rounded-full flex items-center justify-center text-tg-link font-black shadow-inner">
                  {channel.title?.[0]?.toUpperCase() || "CH"}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-tg-text leading-tight group-hover:text-tg-link transition-colors">
                    {channel.title}
                  </h4>
                  <p className="text-[10px] text-tg-hint font-mono mt-1">
                    ID: {channel.tg_channel_id}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-md border border-emerald-500/10 shadow-sm">
                  Активен
                </span>
                <p className="text-[11px] text-tg-link mt-2 font-bold flex items-center justify-end gap-0.5">
                  Настройка{" "}
                  <ChevronRightIcon className="w-3 h-3 stroke-[2.5]" />
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* МОДАЛКА-ИНСТРУКЦИЯ*/}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-tg-bg w-full max-w-sm rounded-t-2xl sm:rounded-tg-mobile-card border border-tg-hint/10 p-5 shadow-2xl relative animate-in slide-in-from-bottom-8 duration-200">
            {/* Шапка модалки */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-tg-text">
                Как подключить ресурс
              </h3>
              <button
                onClick={closeModal}
                className="p-1 text-tg-hint hover:text-tg-text rounded-full bg-tg-secondary-bg transition-colors cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5 stroke-[2]" />
              </button>
            </div>

            {/* 💥 ТАБЫ: Переключатель Канал / Группа */}
            <div className="flex bg-tg-secondary-bg p-1 rounded-xl mb-4 border border-tg-hint/5">
              <button
                onClick={() => setActiveTab("channel")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "channel"
                    ? "bg-tg-button text-tg-button-text shadow-sm"
                    : "text-tg-hint hover:text-tg-text"
                }`}
              >
                Канал
              </button>
              <button
                onClick={() => setActiveTab("group")}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === "group"
                    ? "bg-tg-button text-tg-button-text shadow-sm"
                    : "text-tg-hint hover:text-tg-text"
                }`}
              >
                Группа
              </button>
            </div>

            {/* Контент модалки */}
            <div className="space-y-3 my-2 min-h-[260px]">
              {" "}
              {activeTab === "channel" && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex gap-3 items-start bg-tg-secondary-bg/50 p-3 rounded-xl border border-tg-hint/5">
                    <div className="bg-tg-link text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      1
                    </div>
                    <p className="text-xs text-tg-text font-medium leading-normal">
                      Добавьте нашего бота в свой канал в качестве{" "}
                      <b>Администратора</b> с правом приглашения пользователей.
                    </p>
                  </div>

                  <div className="flex gap-3 items-start bg-tg-secondary-bg/50 p-3 rounded-xl border border-tg-hint/5">
                    <div className="bg-tg-link text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      2
                    </div>
                    <p className="text-xs text-tg-text font-medium leading-normal">
                      Сверните приложение, зайдите в свой канал и{" "}
                      <b>перешлите любой пост</b> в диалог с этим ботом.
                    </p>
                  </div>

                  <div className="flex gap-3 items-start bg-tg-secondary-bg/50 p-3 rounded-xl border border-tg-hint/5">
                    <div className="bg-tg-link text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      3
                    </div>
                    <p className="text-xs text-tg-text font-medium leading-normal">
                      Бот пришлет подтверждение. После этого вернитесь сюда и
                      нажмите кнопку <b>Обновить список</b>.
                    </p>
                  </div>
                </div>
              )}
              {activeTab === "group" && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex gap-3 items-start bg-tg-secondary-bg/50 p-3 rounded-xl border border-tg-hint/5">
                    <div className="bg-tg-link text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      1
                    </div>
                    <p className="text-xs text-tg-text font-medium leading-normal">
                      Добавьте нашего бота в свою группу/чат в качестве{" "}
                      <b>Администратора</b> с правом управления ссылками.
                    </p>
                  </div>

                  <div className="flex gap-3 items-start bg-tg-secondary-bg/50 p-3 rounded-xl border border-tg-hint/5">
                    <div className="bg-tg-link text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      2
                    </div>
                    <p className="text-xs text-tg-text font-medium leading-normal">
                      Напишите прямо в чат группы команду:{" "}
                      <code className="bg-tg-secondary-bg px-1.5 py-0.5 rounded border border-tg-hint/20 font-bold text-tg-link text-[11px]">
                        /bind
                      </code>
                    </p>
                  </div>

                  <div className="flex gap-3 items-start bg-tg-secondary-bg/50 p-3 rounded-xl border border-tg-hint/5">
                    <div className="bg-tg-link text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      3
                    </div>
                    <p className="text-xs text-tg-text font-medium leading-normal">
                      Бот ответит об успешном подключении. После этого вернитесь
                      сюда и нажмите <b>Обновить список</b>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={confirmModal}
              className="w-full bg-tg-button text-tg-button-text hover:opacity-90 py-3 rounded-tg-mobile-btn tg-desk:rounded-tg-desk-btn text-sm font-bold shadow-md mt-3 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
            >
              Всё понял, погнали!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Channels;
