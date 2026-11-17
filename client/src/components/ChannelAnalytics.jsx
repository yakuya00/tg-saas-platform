import React, { useState, useEffect } from "react";
import api from "../api/axios.js";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  LinkIcon,
  ArrowDownTrayIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";

export default function ChannelAnalytics({
  channel,
  initialStats,
  activeCustomersCount,
  averageLtv,
  totalUsdtEarned,
  transactions,
  //onExportCSV,
  handleCopyLink,
}) {
  const [period, setPeriod] = useState("7d");
  const [dailyStats, setDailyStats] = useState(
    Array.isArray(initialStats) ? initialStats : [],
  );
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  useEffect(() => {
    if (period === "7d") {
      setDailyStats(Array.isArray(initialStats) ? initialStats : []);
      return;
    }

    async function fetchExtendedStats() {
      setIsLoadingStats(true);
      try {
        const res = await api.get(
          `/api/channels/${channel.id}/stats?period=${period}`,
        );
        setDailyStats(Array.isArray(res.data) ? res.data : []);
        console.log(`📡 Подгрузили расширенную статистику за период ${period}`);
      } catch (err) {
        console.error(
          "❌ Не удалось загрузить расширенную статистику:",
          err.message,
        );
        setDailyStats([]);
      } finally {
        setIsLoadingStats(false);
      }
    }

    fetchExtendedStats();
  }, [period, channel.id, initialStats]);

  const periodEarnings = Array.isArray(dailyStats)
    ? dailyStats
        .reduce((sum, item) => sum + (Number(item.earnings) || 0), 0)
        .toFixed(2)
    : "0.00";

  const formattedChartData = dailyStats.map((item) => ({
    ...item,
    net_growth: (Number(item.new_subs) || 0) - (Number(item.expired_subs) || 0),
  }));

  const netValues = formattedChartData.map((i) => i.net_growth);
  const maxNet = Math.max(...netValues, 0);
  const minNet = Math.min(...netValues, 0);

  const colorsRatio =
    maxNet + Math.abs(minNet) > 0 ? maxNet / (maxNet + Math.abs(minNet)) : 0.5;

  return (
    <div className="space-y-4 px-3 animate-in fade-in duration-100">
      {/* Ссылка витрины */}
      <div className="bg-tg-bg border border-tg-hint/10 p-3.5 rounded-xl space-y-1.5 shadow-sm">
        <div className="flex items-center gap-1.5 text-tg-hint">
          <LinkIcon className="w-4 h-4 text-tg-link" />
          <span className="text-[11px] text-tg-hint font-bold uppercase tracking-wider block">
            Линк твоей витрины (для закрепа в канале)
          </span>
        </div>
        <div className="flex gap-2 pt-0.5">
          <input
            type="text"
            readOnly
            value={`https://t.me/${channel.bot_username}/`}
            className="flex-1 bg-tg-secondary-bg border border-tg-hint/10 rounded-xl px-3 py-2 text-[11px] text-tg-link font-mono focus:outline-none select-all"
          />
          <button
            onClick={handleCopyLink}
            className="bg-tg-button text-tg-button-text text-[11px] px-3 py-2 rounded-xl font-bold active:opacity-70 cursor-pointer shadow-sm"
          >
            Копировать
          </button>
        </div>
      </div>

      {/* Переключатель периодов */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-tg-hint font-bold uppercase tracking-wider">
          Аналитика и Метрики
        </span>
        <div className="flex bg-tg-secondary-bg p-0.5 rounded-lg border border-tg-hint/5">
          {["7d", "30d", "all"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-md transition-all uppercase cursor-pointer ${
                period === p
                  ? "bg-tg-bg text-tg-link shadow-sm"
                  : "text-tg-hint active:opacity-70"
              }`}
            >
              {p === "7d" ? "7 дней" : p === "30d" ? "30 дней" : "Всё время"}
            </button>
          ))}
        </div>
      </div>

      {/* 📊 Сетка карточек */}
      <div className="grid grid-cols-2 gap-2">
        {/* Карточка 1: Выручка за выбранный период */}
        <div className="bg-tg-bg p-3.5 rounded-xl border border-tg-hint/10 shadow-sm flex flex-col justify-between h-[68px]">
          <span className="text-[9.5px] text-tg-hint font-bold uppercase tracking-wider block leading-tight">
            Выручка тренда (
            {period === "30d" ? "30д" : period === "all" ? "все" : "7д"})
          </span>
          <span className="text-[18px] font-black text-tg-text leading-none mt-auto">
            {periodEarnings} <span className="text-xs text-tg-link">$</span>
          </span>
        </div>

        {/* Карточка 2: Активные пользователи */}
        <div className="bg-tg-bg p-3.5 rounded-xl border border-tg-hint/10 shadow-sm flex flex-col justify-between h-[68px]">
          <span className="text-[9.5px] text-tg-hint font-bold uppercase tracking-wider block leading-tight">
            Активные сабы
          </span>
          <span className="text-[18px] font-black text-tg-text leading-none flex items-baseline gap-1.5 mt-auto">
            {activeCustomersCount || 0}
            <span className="text-[10px] text-emerald-500 font-bold">
              Живые
            </span>
          </span>
        </div>

        {/* Карточка 3: Средний LTV */}
        <div className="bg-tg-bg p-3.5 rounded-xl border border-tg-hint/10 shadow-sm flex flex-col justify-between h-[68px]">
          <span className="text-[9.5px] text-tg-hint font-bold uppercase tracking-wider block leading-tight">
            Средний LTV клиента
          </span>
          <span className="text-[18px] font-black text-tg-text leading-none mt-auto">
            {Number(averageLtv || 0).toFixed(2)}{" "}
            <span className="text-xs text-emerald-500">$</span>
          </span>
        </div>

        {/* Карточка 4: Общий капитал в USD за всё время */}
        <div className="bg-tg-bg p-3.5 rounded-xl border border-tg-hint/10 shadow-sm flex flex-col justify-between h-[68px]">
          <span className="text-[9.5px] text-tg-hint font-bold uppercase tracking-wider block leading-tight">
            Заработано всего
          </span>
          <span className="text-[18px] font-black text-emerald-500 leading-none mt-auto">
            ${Number(totalUsdtEarned || 0).toFixed(2)}
          </span>
        </div>
      </div>

      {/* 📉 График 1: Выручка в USD */}
      <div className="bg-tg-bg p-4 rounded-xl border border-tg-hint/10 shadow-sm space-y-2 relative">
        {isLoadingStats && (
          <div className="absolute inset-0 bg-tg-bg/50 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-10 text-[11px] text-tg-hint font-bold">
            Загрузка тренда...
          </div>
        )}
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] text-tg-hint font-bold uppercase tracking-wider">
            Динамика оборота
          </span>
          <span className="text-[10px] text-tg-link font-bold">
            В долларах ($)
          </span>
        </div>
        <div className="h-44 w-full pt-2 -ml-6 focus:outline-none select-none">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              style={{ outline: "none" }}
              data={dailyStats}
              margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--tg-theme-link-color, #2481cc)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--tg-theme-link-color, #2481cc)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                interval={period === "7d" ? 0 : "preserveEnd"}
                tick={{
                  fill: "var(--tg-theme-hint-color, #999999)",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "var(--tg-theme-hint-color, #999999)",
                  fontSize: 10,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--tg-theme-bg-color, #ffffff)",
                  borderRadius: "12px",
                  borderColor: "rgba(153, 153, 153, 0.1)",
                }}
                labelStyle={{
                  color: "var(--tg-theme-hint-color, #999999)",
                  fontSize: 11,
                  fontWeight: "bold",
                }}
                itemStyle={{
                  color: "var(--tg-theme-text-color, #000000)",
                  fontSize: 12,
                  fontWeight: "black",
                }}
                formatter={(value) => [
                  `$${Number(value).toFixed(2)}`,
                  "Выручка",
                ]}
              />
              <Area
                type="monotone"
                dataKey="earnings"
                stroke="var(--tg-theme-link-color, #2481cc)"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorEarnings)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 📊 УЛЬТИМАТИВНЫЙ ГРАФИК: Net Growth с полной инфой внутри */}
      <div className="bg-tg-bg p-4 rounded-xl border border-tg-hint/10 shadow-sm space-y-2 relative">
        {isLoadingStats && (
          <div className="absolute inset-0 bg-tg-bg/50 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-10 text-[11px] text-tg-hint font-bold">
            Загрузка...
          </div>
        )}

        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] text-tg-hint font-bold uppercase tracking-wider">
            Чистый прирост аудитории (чел.)
          </span>
          <span className="text-[10px] text-tg-link font-bold">
            Прибыло/Выбыло
          </span>
        </div>

        <div className="h-36 w-full pt-2 -ml-6 focus:outline-none select-none">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              style={{ outline: "none" }}
              data={formattedChartData}
              margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset={colorsRatio}
                    stopColor="#00e676"
                    stopOpacity={0.45}
                  />{" "}
                  <stop
                    offset={colorsRatio}
                    stopColor="#ff1744"
                    stopOpacity={0.45}
                  />{" "}
                </linearGradient>
              </defs>

              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                interval={period === "7d" ? 0 : "preserveStartEnd"}
                tick={{
                  fill: "var(--tg-theme-hint-color, #999999)",
                  fontSize: 10,
                  fontWeight: "bold",
                }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: "var(--tg-theme-hint-color, #999999)",
                  fontSize: 10,
                }}
                allowDecimals={false}
              />

              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--tg-theme-bg-color, #ffffff)",
                  borderRadius: "12px",
                  borderColor: "rgba(153, 153, 153, 0.1)",
                }}
                labelStyle={{
                  color: "var(--tg-theme-hint-color, #999999)",
                  fontSize: 11,
                  fontWeight: "bold",
                }}
                itemStyle={{ fontSize: 12, padding: "2px 0" }}
                formatter={(value, name, props) => {
                  const { net_growth, new_subs, expired_subs } = props.payload;

                  if (name === "Баланс") {
                    return [
                      <div className="space-y-1">
                        <div className="font-black text-[13px]">
                          Итог:{" "}
                          <span
                            className={
                              net_growth >= 0
                                ? "text-[#00e676]"
                                : "text-[#ff1744]"
                            }
                          >
                            {net_growth > 0 ? `+${net_growth}` : net_growth}{" "}
                            чел.
                          </span>
                        </div>
                        <div className="text-[11px] text-tg-text/80 font-normal border-t border-tg-hint/10 pt-1 mt-1 space-y-0.5">
                          <div>
                            Прибыло:{" "}
                            <span className="text-[#00e676] font-bold">
                              +{new_subs}
                            </span>
                          </div>
                          <div>
                            Выбыло:{" "}
                            <span className="text-[#ff1744] font-bold">
                              -{expired_subs}
                            </span>
                          </div>
                        </div>
                      </div>,
                      null,
                    ];
                  }
                  return [value, name];
                }}
              />

              <ReferenceLine
                y={0}
                stroke="var(--tg-theme-hint-color, #999999)"
                strokeOpacity={0.5}
                strokeWidth={1.5}
              />

              <Area
                type="monotone"
                dataKey="net_growth"
                name="Баланс"
                stroke="url(#splitColor)"
                strokeWidth={3}
                fill="url(#splitColor)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* История транзакций */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] text-tg-hint font-bold uppercase tracking-wider block">
            История транзакций
          </span>
          {/* <button
            onClick={onExportCSV}
            className="text-[11px] font-bold text-tg-link flex items-center gap-1 active:opacity-70 cursor-pointer bg-tg-bg border border-tg-hint/10 px-2.5 py-1 rounded-lg shadow-sm"
          >
            <ArrowDownTrayIcon className="w-3.5 h-3.5 stroke-[2.5]" /> Экспорт
            CSV
          </button> */}
        </div>

        <div className="bg-tg-bg border border-tg-hint/10 rounded-xl overflow-hidden shadow-sm">
          {transactions.length === 0 ? (
            <div className="p-4 text-center text-xs text-tg-hint font-medium">
              Нет транзакций за выбранный период
            </div>
          ) : (
            transactions.map((tx) => {
              const isDeposit =
                tx.type === "subscription" || tx.type === "donate";
              const txType = tx.type;
              const nominalAmount =
                isDeposit && tx.net_amount
                  ? (Number(tx.net_amount) / 0.97).toFixed(2)
                  : Number(tx.amount).toFixed(2);

              const appFee =
                isDeposit && tx.net_amount
                  ? (Number(nominalAmount) - Number(tx.net_amount)).toFixed(2)
                  : null;

              return (
                <div
                  key={tx.id}
                  className="border-b border-tg-hint/10 last:border-none p-3.5 pl-4 flex flex-col gap-2 animate-in fade-in duration-100"
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-inner ${
                          txType === "withdraw"
                            ? "bg-amber-500/10 text-amber-500"
                            : txType === "donate"
                              ? "bg-pink-500/10 text-pink-500"
                              : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        <BanknotesIcon className="w-4 h-4 stroke-[2]" />
                      </div>

                      {/* Информационный текстовый блок */}
                      <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                        <h4 className="font-bold text-[13px] text-tg-text truncate leading-tight">
                          {tx.service_name}
                        </h4>

                        <p className="text-[11px] text-tg-text/90 font-medium truncate leading-none">
                          {txType === "withdraw"
                            ? `Кошелек: ${tx.wallet}`
                            : `@${tx.user_username || "anonymous"}`}
                        </p>
                        <p className="text-[10px] text-tg-hint leading-none">
                          {tx.created_at}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col justify-center min-w-[75px]">
                      <span
                        className={`text-[13.5px] font-black ${txType === "withdraw" ? "text-tg-text" : "text-emerald-500"} leading-tight`}
                      >
                        {txType === "withdraw"
                          ? `-${nominalAmount}`
                          : `+${nominalAmount}`}{" "}
                        $
                      </span>

                      {tx.net_amount && isDeposit && (
                        <div className="space-y-0.5 mt-0.5">
                          <p className="text-[9.5px] text-tg-text font-bold leading-none">
                            Чистыми:{" "}
                            <span className="text-emerald-500">
                              ${Number(tx.net_amount).toFixed(2)}
                            </span>
                          </p>
                          <p className="text-[8px] text-tg-hint font-medium leading-none">
                            Платформа: -${appFee}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {tx.customer_comment && (
                    <div className="flex gap-2 items-start bg-tg-secondary-bg/60 p-2 rounded-lg border border-tg-hint/5 text-[11px] text-tg-text font-medium leading-relaxed italic ml-11">
                      <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 text-pink-500 shrink-0 mt-0.5" />
                      <p>"{tx.customer_comment}"</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
