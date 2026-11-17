import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useTelegramAuthAndRoute } from "./hooks/useTelegramAuthAndRoute.js";

import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/MainDashboard.jsx";
import Channels from "./pages/Channels.jsx";
import ChannelDetails from "./pages/ChannelDetails.jsx";
import Finances from "./pages/Finances.jsx";
import Settings from "./pages/Settings.jsx";
import ClientPay from "./pages/ClientPay.jsx";

function App() {
  useTelegramAuthAndRoute();

  return (
    <Routes>
      {/* Публичная страница оплаты */}
      <Route path="/pay/:channelId" element={<ClientPay />} />

      {/* Личный кабинет админа */}
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="channels" element={<Channels />} />
        <Route path="channels/:id" element={<ChannelDetails />} />
        <Route path="finance" element={<Finances />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
