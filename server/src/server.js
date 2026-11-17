import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { startBot } from "./bot/bot.js";
import { initSubscriptionWorker } from "./workers/subscriptionWorker.js";
import authRouter from "./routes/auth.router.js";
import userRouter from "./routes/user.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import channelRouter from "./routes/channel.router.js";
import paymentRouter from "./routes/payment.router.js";
import financeRouter from "./routes/finance.router.js";
import { botManager } from "./services/botManager.service.js";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// ====================================================
// API РОУТЫ ДЛЯ РЕАКТА
// ====================================================

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/channels", channelRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/finance", financeRouter);

app.use(errorHandler);

// ====================================================
// ЗАПУСК СЕРВИСОВ
// ====================================================

initSubscriptionWorker();
botManager.initAllBots();
await startBot();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🔥 Express сервер успешно запущен на порту ${PORT}`),
);
