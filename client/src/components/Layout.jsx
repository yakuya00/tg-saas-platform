import React, { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTelegram } from "../context/TelegramContext";

const Layout = () => {
  const { tg } = useTelegram();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (!webApp?.BackButton) return;

    if (location.pathname === "/") {
      webApp.BackButton.hide();
    } else {
      webApp.BackButton.show();
    }

    const handleBackClick = () => {
      webApp.HapticFeedback?.impactOccurred("light");
      navigate(-1);
    };

    webApp.BackButton.onClick(handleBackClick);
    return () => webApp.BackButton.offClick(handleBackClick);
  }, [location.pathname, navigate]);

  useEffect(() => {
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      webApp.ready();
      const platform = webApp.platform || "ios";
      document.documentElement.setAttribute("data-platform", platform);
      webApp.setHeaderColor("secondary_bg_color");
      webApp.setBackgroundColor("secondary_bg_color");
    }
  }, []);

  return (
    <div className="min-h-screen bg-tg-secondary-bg text-tg-text font-sans antialiased pb-8">
      <div className="pt-4 px-4">
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
