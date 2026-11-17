import React, { useState } from "react";
import foxMascot from "../assets/fox.png";
import {
  PlusIcon,
  XMarkIcon,
  CalendarIcon,
  CpuChipIcon,
  LinkIcon,
  ChevronRightIcon,
  ChartBarIcon,
  Square3Stack3DIcon,
  MegaphoneIcon,
  PaperAirplaneIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import ChannelAnalytics from "../components/ChannelAnalytics.jsx";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useChannelDetails } from "../hooks/useChannelDetails.js";
import PromoCodesSlice from "../components/PromoCodesSlice.jsx";
import GiveAwaysSlice from "../components/GiveAwaysSlice.jsx";
import PromoCreateModal from "../components/PromoCreateModal.jsx";
import GiveAwayCreateModal from "../components/GiveAwayCreateModal.jsx";

const ChannelDetails = () => {
  const {
    loading,
    channel,
    currencies,
    formattedServices,
    isModalOpen,
    analyticsSummary,
    promoCodes,
    giveaways,
    loadData,
    openModal,
    closeModal,
    botTokenInput,
    setBotTokenInput,
    isUpdatingBot,
    handleUpdateBotToken,
    handleCopyLink,
    handleDeleteService,
    form,
    promoForm,
    giveawayForm,
  } = useChannelDetails();

  const [activeTab, setActiveTab] = useState("analytics"); // analytics | products | marketing

  const [broadcasts, setBroadcasts] = useState([
    {
      id: 1,
      message_text: "Скидки на приватный канал заканчиваются через 2 часа!",
      target_segment: "expired",
      status: "completed",
      sent_count: 124,
    },
    {
      id: 2,
      message_text: "Новый пост уже в канале! Погнали читать",
      target_segment: "all",
      status: "completed",
      sent_count: 540,
    },
    {
      id: 3,
      message_text: "Поздравляем с майскими праздниками!",
      target_segment: "all",
      status: "completed",
      sent_count: 522,
    },
    {
      id: 4,
      message_text: "Старая забытая рассылка из прошлого года...",
      target_segment: "active",
      status: "completed",
      sent_count: 99,
    },
  ]);

  const [period, setPeriod] = useState("7d");

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-tg-secondary-bg animate-fade-in">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-32 w-32 rounded-full bg-tg-link opacity-15 blur-2xl animate-pulse"></div>

          <img
            src={foxMascot}
            alt="Loading..."
            className="relative h-80 w-80 object-contain animate-bounce select-none"
          />
        </div>

        <p className="mt-8 text-sm font-semibold text-tg-text opacity-70 tracking-widest animate-pulse">
          Загрузка...
        </p>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="text-center text-red-500 font-bold p-6 text-sm">
        Канал не найден
      </div>
    );
  }

  // ====================================================================
  // ВАРИАНТ А: У КАНАЛА НЕТ ТОКЕНА БОТА
  // ====================================================================
  if (!channel.bot_token) {
    return (
      <div className="animate-in fade-in duration-150 bg-tg-secondary-bg min-h-screen text-tg-text">
        <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-tg-hint/10 bg-tg-secondary-bg">
          <h2 className="text-[16px] font-bold tracking-tight max-w-[70%] truncate">
            {channel.title}
          </h2>
          <span className="text-[11px] bg-tg-link text-white px-2.5 py-0.5 rounded-full font-bold">
            Шаг 3 из 3
          </span>
        </div>
        <div className="p-4 space-y-4">
          <div className="bg-tg-bg rounded-xl p-4 border border-tg-hint/10 space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-tg-link">
              <CpuChipIcon className="w-5 h-5 stroke-[2]" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                White-Label активация
              </h3>
            </div>
            <p className="text-[13px] text-tg-text leading-snug">
              Чтобы запустить продажи продуктов от имени вашего личного бренда,
              выполните 3 простых действия:
            </p>
            <div className="space-y-3 pt-1">
              {[
                {
                  n: 1,
                  t: 'Перейдите в <a href="https://t.me/BotFather" target="_blank" class="text-tg-link font-bold hover:underline">@BotFather</a> и создайте бота командой <code class="bg-tg-secondary-bg px-1 py-0.5 rounded text-xs font-mono">/newbot</code>',
                },
                {
                  n: 2,
                  t: 'Включите Web App меню командой <code class="bg-tg-secondary-bg px-1 py-0.5 rounded text-xs font-mono">/newapp</code>, привязав его к вашей ссылке.',
                },
                {
                  n: 3,
                  t: 'Скопируйте выданный <code class="text-amber-500 font-bold font-mono">API TOKEN</code>, вставьте его ниже.',
                },
              ].map((step) => (
                <div
                  key={step.n}
                  className="flex gap-3 items-start text-[12.5px] leading-snug text-tg-text"
                >
                  <span className="flex items-center justify-center bg-tg-link/10 text-tg-link font-black rounded-full w-5 h-5 text-[11px] shrink-0">
                    {step.n}
                  </span>
                  <p dangerouslySetInnerHTML={{ __html: step.t }} />
                </div>
              ))}
            </div>
          </div>
          <form onSubmit={handleUpdateBotToken} className="space-y-3">
            <div className="px-1">
              <label className="block text-[11px] font-bold text-tg-hint uppercase tracking-wider mb-1.5">
                API Token вашего бота:
              </label>
              <input
                type="text"
                required
                placeholder="1234567890:ABCdefGhIJKlmNoPQRsTUVwXyZ"
                value={botTokenInput}
                onChange={(e) => setBotTokenInput(e.target.value)}
                className="w-full bg-tg-bg border border-tg-hint/15 rounded-xl px-4 py-3 text-[13px] text-tg-text font-mono focus:outline-none focus:border-tg-link placeholder-tg-hint/40 shadow-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isUpdatingBot}
              className="w-full bg-tg-button text-tg-button-text active:opacity-90 py-3.5 rounded-xl text-[14px] font-bold transition-all flex items-center justify-center min-h-[44px] cursor-pointer shadow-sm"
            >
              {isUpdatingBot ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-tg-button-text border-b-transparent"></div>
              ) : (
                "Активировать витрину"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-150 bg-tg-secondary-bg min-h-screen text-tg-text pb-16">
      {/* ШАПКА КАНАЛА */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-tg-hint/10 bg-tg-secondary-bg sticky top-0 z-20 transition-colors">
        <div className="max-w-[70%]">
          <h2 className="text-[16px] font-bold text-tg-text truncate">
            {channel.title}
          </h2>
          <p className="text-[11px] text-tg-link font-medium mt-0.5">
            @ {channel.bot_username || "wl_bot"}
          </p>
        </div>
        <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
          Active
        </span>
      </div>

      {/* СИСТЕМНЫЕ СЕГМЕНТ-ТАБЫ */}
      <div className="p-3">
        <div className="bg-tg-bg border border-tg-hint/10 p-0.5 rounded-xl flex shadow-sm">
          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeTab === "analytics" ? "bg-tg-secondary-bg text-tg-link shadow-sm" : "text-tg-hint"}`}
          >
            <ChartBarIcon className="w-4 h-4" /> Аналитика
          </button>
          <button
            onClick={() => setActiveTab("products")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeTab === "products" ? "bg-tg-secondary-bg text-tg-link shadow-sm" : "text-tg-hint"}`}
          >
            <Square3Stack3DIcon className="w-4 h-4 " /> Продукты
          </button>
          <button
            onClick={() => setActiveTab("marketing")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${activeTab === "marketing" ? "bg-tg-secondary-bg text-tg-link shadow-sm" : "text-tg-hint"}`}
          >
            <MegaphoneIcon className="w-4 h-4" /> Настройки
          </button>
        </div>
      </div>

      {/* ====================================================================
          ТАБ 1: АНАЛИТИКА + ЛЕНТА ТРАНЗАКЦИЙ
          ==================================================================== */}
      {activeTab === "analytics" && !loading && channel && (
        <ChannelAnalytics
          channel={channel}
          initialStats={analyticsSummary.graph_data}
          activeCustomersCount={analyticsSummary.active_customers_count}
          averageLtv={analyticsSummary.average_ltv}
          totalUsdtEarned={analyticsSummary.total_usdt_earned}
          transactions={analyticsSummary.transactions || []}
          handleCopyLink={handleCopyLink}
          // onExportCSV={handleExportTransactionsToCSV}
        />
      )}

      {/* ====================================================================
          ТАБ 2: УПРАВЛЕНИЕ ТАРИФАМИ
          ==================================================================== */}
      {activeTab === "products" && (
        <div className="space-y-3 px-3 animate-in fade-in duration-100">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] text-tg-hint font-bold uppercase tracking-wider">
              Позиции на витрине боте
            </h3>
            <button
              onClick={openModal}
              className="text-[13px] font-bold text-tg-link flex items-center gap-0.5 active:opacity-70 cursor-pointer"
            >
              <PlusIcon className="w-4 h-4 stroke-[2.5]" /> Добавить
            </button>
          </div>

          {formattedServices.length === 0 ? (
            <div className="bg-tg-bg border border-tg-hint/10 p-6 rounded-xl text-center shadow-sm">
              <p className="text-xs text-tg-hint leading-normal">
                Ваша витрина пока пуста. Добавьте первую услугу (подписку или
                донат), чтобы запустить продажи.
              </p>
            </div>
          ) : (
            <div className="bg-tg-bg border border-tg-hint/10 rounded-xl overflow-hidden shadow-sm">
              {formattedServices.map((service, index) => (
                <div
                  key={service.id}
                  className={`flex items-center justify-between py-3.5 pr-3 ml-4 ${index !== formattedServices.length - 1 ? "border-b border-tg-hint/10" : ""}`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[14px] text-tg-text leading-tight">
                        {service.title}
                      </h4>
                      <span className="text-[8px] uppercase px-1.5 py-0.5 rounded font-black bg-tg-secondary-bg text-tg-hint border border-tg-hint/10">
                        {service.type}
                      </span>
                    </div>
                    {service.type === "subscription" && (
                      <p className="text-[11px] text-tg-hint flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5 opacity-60" />{" "}
                        {service.duration_days} дней
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-black text-tg-text">
                      ${Number(service.price).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="p-1 text-tg-hint hover:text-red-500 active:scale-90 transition-transform cursor-pointer"
                    >
                      <XMarkIcon className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          ТАБ 3: НАСТРОЙКИ И МАРКЕТИНГ
          ==================================================================== */}
      {activeTab === "marketing" && (
        <div className="space-y-5 px-3 animate-in fade-in duration-100">
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[11px] text-tg-hint font-bold uppercase tracking-wider">
                Уведомления и рассылки
              </h3>
              <button
                onClick={() => alert("Интеграция рассылок")}
                className="text-[12px] font-bold text-tg-link flex items-center gap-0.5 active:opacity-70 cursor-pointer"
              >
                <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" /> Создать
              </button>
            </div>

            <div className="bg-tg-bg border border-tg-hint/10 rounded-xl overflow-hidden shadow-sm">
              {broadcasts.slice(0, 3).map((bc, index) => (
                <div
                  key={bc.id}
                  className={`flex items-center justify-between p-3.5 pl-4 ${index !== Math.min(broadcasts.length, 3) - 1 ? "border-b border-tg-hint/10" : ""}`}
                >
                  <div className="flex items-center gap-3 max-w-[75%]">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-blue-400 to-indigo-600 text-white flex items-center justify-center shadow-sm shrink-0">
                      <PaperAirplaneIcon className="w-4 h-4 stroke-[2] -rotate-12" />
                    </div>
                    <div className="truncate">
                      <h4 className="font-semibold text-[13px] text-tg-text truncate">
                        {bc.message_text}
                      </h4>
                      <p className="text-[10px] text-tg-hint mt-0.5 uppercase tracking-wide font-bold">
                        Сегмент:{" "}
                        <span className="text-tg-link">
                          {bc.target_segment}
                        </span>
                        {bc.status === "completed"
                          ? ` • Получили: ${bc.sent_count}`
                          : ` • ${bc.run_at}`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${bc.status === "completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}
                  >
                    {bc.status}
                  </span>
                </div>
              ))}

              {broadcasts.length > 3 && (
                <button
                  onClick={() =>
                    alert(
                      `Открыть архив всех рассылок (${broadcasts.length} шт.)`,
                    )
                  }
                  className="w-full bg-tg-bg hover:bg-tg-secondary-bg/50 text-center py-2.5 text-[11px] font-bold text-tg-link border-t border-tg-hint/5 active:opacity-80 transition-colors"
                >
                  Показать все рассылки ({broadcasts.length})
                </button>
              )}
            </div>
          </div>

          <GiveAwaysSlice giveaways={giveaways} open={giveawayForm.open} />
          <PromoCodesSlice promoCodes={promoCodes} open={promoForm.open} />

          <div className="space-y-2">
            <h3 className="text-[11px] text-tg-hint font-bold uppercase tracking-wider px-1">
              Кастомизация витрины
            </h3>
            <div className="bg-tg-bg border border-tg-hint/10 rounded-xl overflow-hidden shadow-sm">
              <div
                onClick={() =>
                  handleNavigation(`/channels/${channel.id}/landing`)
                }
                className="flex items-center justify-between px-4 py-3.5 active:bg-tg-secondary-bg transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-pink-400 to-rose-500 text-white flex items-center justify-center shadow-sm">
                    <GlobeAltIcon className="w-4 h-4 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-tg-text block">
                      Внешний вид витрины
                    </span>
                    <span className="text-[10px] text-tg-hint block -mt-0.5">
                      Описание, логотип, FAQ, кружки
                    </span>
                  </div>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-tg-hint/40" />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-tg-hint/10">
            <h3 className="text-[11px] text-tg-hint font-bold uppercase tracking-wider px-1">
              Конфигурация White-Label
            </h3>
            <div className="bg-tg-bg border border-tg-hint/10 p-4 rounded-xl space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-tg-hint mb-1">
                <CpuChipIcon className="w-4 h-4 stroke-[2]" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Обновление API Токена
                </span>
              </div>
              <form onSubmit={handleUpdateBotToken} className="flex gap-2">
                <input
                  type="password"
                  placeholder="Вставьте новый токен из @BotFather..."
                  value={botTokenInput}
                  onChange={(e) => setBotTokenInput(e.target.value)}
                  className="flex-1 bg-tg-secondary-bg border border-tg-hint/10 rounded-xl px-3 py-2 text-[12px] text-tg-text font-mono focus:outline-none focus:border-tg-link"
                />
                <button
                  type="submit"
                  disabled={isUpdatingBot}
                  className="bg-tg-button text-tg-button-text px-4 py-2 rounded-xl text-[12px] font-bold active:opacity-80 cursor-pointer shadow-sm"
                >
                  {isUpdatingBot ? "..." : "Сменить"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET СОЗДАНИЯ ПРОДУКТА */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={closeModal} />
          <div className="bg-tg-bg w-full rounded-t-3xl border-t border-tg-hint/10 p-5 pb-8 shadow-2xl relative animate-in slide-in-from-bottom-25 duration-300">
            <div className="w-10 h-1.5 bg-tg-hint/20 rounded-full mx-auto mb-4 -mt-1" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[16px] text-tg-text">
                Новый продукт витрины
              </h3>
              <button
                onClick={closeModal}
                className="text-[14px] font-bold text-tg-link cursor-pointer"
              >
                Отмена
              </button>
            </div>
            <form onSubmit={form.handleCreateService} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-tg-hint uppercase tracking-wider mb-1 pl-1">
                  Тип коммерческой услуги
                </label>
                <select
                  value={form.type}
                  onChange={(e) => form.setType(e.target.value)}
                  className="w-full bg-tg-secondary-bg border border-tg-hint/10 rounded-xl px-3.5 py-3 text-[13px] text-tg-text font-bold appearance-none focus:outline-none focus:border-tg-link shadow-inner"
                >
                  <option value="subscription">
                    Платная подписка на приватку
                  </option>
                  {/* <option value="digital_product">
                    Цифровой товар (Файл, гайд, пак)
                  </option>
                  <option value="paid_chat">Платный приватный диалог</option>
                  <option value="donate">Добровольный донат</option> */}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-tg-hint uppercase tracking-wider mb-1 pl-1">
                  Название позиции
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: VIP Чат"
                  value={form.title}
                  onChange={(e) => form.setTitle(e.target.value)}
                  className="w-full bg-tg-secondary-bg border border-tg-hint/10 rounded-xl px-3.5 py-3 text-[13px] text-tg-text focus:outline-none focus:border-tg-link shadow-inner"
                />
              </div>
              {form.type === "subscription" && (
                <div>
                  <label className="block text-[11px] font-bold text-tg-hint uppercase tracking-wider mb-1 pl-1">
                    Период действия
                  </label>
                  <select
                    value={form.durationDays}
                    onChange={(e) => form.setDurationDays(e.target.value)}
                    className="w-full bg-tg-secondary-bg border border-tg-hint/10 rounded-xl px-3.5 py-3 text-[13px] text-tg-text font-bold focus:outline-none focus:border-tg-link shadow-inner"
                  >
                    <option value="7">1 неделя (7 дней)</option>
                    <option value="30">1 месяц (30 дней)</option>
                    <option value="90">3 месяца (90 дней)</option>
                    <option value="365">1 год (365 дней)</option>
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold text-tg-hint uppercase tracking-wider mb-1 pl-1">
                  Стоимость позиции ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={form.price}
                  onChange={(e) => form.setPrice(e.target.value)}
                  className="w-full bg-tg-secondary-bg border border-tg-hint/10 rounded-xl px-3.5 py-3 text-[13px] text-tg-text font-mono font-bold focus:outline-none focus:border-tg-link shadow-inner"
                />
              </div>
              <button
                type="submit"
                disabled={form.formLoading}
                className="w-full bg-tg-button text-tg-button-text py-3.5 rounded-xl text-[14px] font-bold shadow-md transition-all active:scale-[0.99] flex items-center justify-center min-h-[44px] cursor-pointer mt-2"
              >
                {form.formLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-tg-button-text border-b-transparent"></div>
                ) : (
                  "Создать продукт"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {promoForm.isOpen && (
        <PromoCreateModal
          channelId={channel.id}
          close={promoForm.close}
          loadData={loadData}
          setIsPromoModalOpen={promoForm.setIsPromoModalOpen}
        />
      )}
      {giveawayForm.isOpen && (
        <GiveAwayCreateModal
          channelId={channel.id}
          close={giveawayForm.close}
          loadData={loadData}
          setIsGiveAwayModalOpen={giveawayForm.setIsGiveawayModalOpen}
          formattedServices={formattedServices}
        />
      )}
    </div>
  );
};

export default ChannelDetails;
