import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { TelegramProvider } from "./context/TelegramContext.jsx";
import App from "./App.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <TelegramProvider>
        <App />
      </TelegramProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
