import React, { createContext, useContext, useEffect, useState } from "react";
import foxMascot from "../assets/fox.png";
import api from "../api/axios.js";

const TelegramContext = createContext(null);

export const TelegramProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (!tg) {
      setLoading(false);
      return;
    }

    tg.ready();
    tg.expand();

    const isClient = tg.initDataUnsafe?.start_param;

    async function initAuth() {
      try {
        const userRes = await api.get("/api/users/me");
        console.log(userRes.data.user);
        setUser(userRes.data.user);
      } catch (err) {
        const isPayPage = window.location.pathname.includes("/pay");

        if (!isPayPage) {
          setError(err.response?.data?.error || "Ошибка авторизации");
        }
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, [tg]);

  return (
    <TelegramContext.Provider
      value={{ tg, user, isClient: !!tg?.initDataUnsafe?.start_param }}
    >
      {loading ? (
        // <div className="flex items-center justify-center min-h-screen bg-tg-secondary-bg">
        //   <div className="animate-spin rounded-full h-8 w-8 border-2 border-tg-link border-b-transparent"></div>
        // </div>
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
      ) : error ? (
        <div className="flex items-center justify-center min-h-screen bg-tg-secondary-bg text-red-500 p-6 text-center">
          {error}
        </div>
      ) : (
        children
      )}
    </TelegramContext.Provider>
  );
};

export const useTelegram = () => useContext(TelegramContext);
