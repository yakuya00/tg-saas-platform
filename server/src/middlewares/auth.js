import crypto from "crypto";
import createError from "http-errors";
import { channelRepository } from "../repositories/channel.repository.js";

export async function verifyTelegramWebAppData(req, res, next) {
  const initData =
    req.headers["x-tg-init-data"] ||
    req.headers["authorization"]?.split(" ")[1];

  if (!initData) {
    return next(createError(401, "Telegram init data parameters are missing"));
  }

  const channelId = req.query.channelId || req.headers["x-channel-id"];
  let botToken = process.env.BOT_TOKEN;

  if (channelId) {
    try {
      const channel = await channelRepository.getChannelById(channelId);
      if (channel && channel.bot_token) {
        botToken = channel.bot_token;
        console.log(
          `🔑 Успешный перехват X-Channel-Id: ${channelId}. Валидируем токеном канала.`,
        );
      }
    } catch (dbErr) {
      console.error("⚠️ Ошибка при поиске токена бота в БД:", dbErr.message);
    }
  }

  try {
    const q = new URLSearchParams(initData);
    const hash = q.get("hash");
    q.delete("hash");

    const keys = Array.from(q.keys()).sort();
    const dataCheckString = keys
      .map((key) => `${key}=${q.get(key)}`)
      .join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken || "")
      .digest();

    const validationHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    if (validationHash !== hash) {
      return next(
        createError(
          403,
          "Init data verification failed. Invalid hash signature.",
        ),
      );
    }

    const userJson = q.get("user");
    if (!userJson) {
      return next(
        createError(400, "User data not found in Telegram init string"),
      );
    }

    try {
      req.tgUser = JSON.parse(userJson);
    } catch (jsonErr) {
      return next(
        createError(400, "Invalid JSON format in Telegram user object"),
      );
    }

    req.tgStartParam = q.get("start_param");

    next();
  } catch (error) {
    if (error.status) {
      return next(error);
    }

    console.error("💥 CRITICAL AUTH MIDDLEWARE ERROR:", error.message);
    return next(createError(500, "Internal authentication system error"));
  }
}
