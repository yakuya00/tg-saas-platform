import React from "react";
import { useSettings } from "../hooks/useSettings.js";

const Settings = () => {
  const { user, platformVersion } = useSettings();

  return (
    <div className="p-4 space-y-4 bg-[#141416] min-h-screen text-white font-sans select-none">
      <div>
        <h2 className="text-lg font-bold text-zinc-100">Настройки</h2>
        <p className="text-xs text-zinc-400">
          Конфигурация твоего аккаунта и платформы
        </p>
      </div>

      <div className="bg-[#1c1c1e] rounded-2xl border border-zinc-850 divide-y divide-zinc-800/60 overflow-hidden shadow-lg">
        <div className="p-4 flex justify-between items-center">
          <span className="text-sm text-zinc-300">Администратор</span>
          <span className="text-sm text-zinc-400 font-medium">
            {user?.first_name || "Не авторизован"}
          </span>
        </div>

        <div className="p-4 flex justify-between items-center">
          <span className="text-sm text-zinc-300">Язык платформы</span>
          <span className="text-sm text-blue-400 font-bold bg-blue-500/5 px-2 py-0.5 rounded-md border border-blue-500/10">
            RU
          </span>
        </div>

        <div className="p-4 flex justify-between items-center">
          <span className="text-sm text-zinc-300">Версия системы</span>
          <span className="text-xs text-zinc-500 font-mono">
            {platformVersion}
          </span>
        </div>
      </div>

      <div className="bg-[#1c1c1e] rounded-2xl border border-zinc-850 p-4 text-xs text-zinc-400 leading-relaxed shadow-lg">
        💡 <b>Справка по подключению:</b> Чтобы добавить новый канал в систему,
        перешли любой пост из него твоему боту в личные сообщения. Бот
        автоматически проверит права и создаст карточку управления.
      </div>
    </div>
  );
};

export default Settings;
