import createError from "http-errors";
import { channelRepository } from "../repositories/channel.repository.js";
import { platformServicesRepository } from "../repositories/platformServices.repository.js";
import axios from "axios";
import { bot } from "../bot/bot.js";
import { botManager } from "./botManager.service.js";
import { paymentRepository } from "../repositories/payment.repository.js";

class ChannelService {
  async getAdminChannelsCount(adminId) {
    if (!adminId) {
      throw createError(400, "Не передан ID пользователя Telegram.");
    }

    const count = await channelRepository.countChannelsByAdminTgId(adminId);

    return count;
  }

  async getAdminChannels(adminId) {
    if (!adminId) {
      throw createError(400, "Не передан ID пользователя Telegram.");
    }

    const rawChannels = await channelRepository.findChannelsByAdminId(adminId);

    const processedChannels = rawChannels.map((channel) => ({
      ...channel,
    }));

    const botUsername = bot.botInfo?.username || "your_bot_username";

    return {
      channels: processedChannels,
      botUsername,
    };
  }

  async getChannelData(adminId, channelId) {
    if (!adminId) {
      throw createError(400, "Не передан ID пользователя Telegram.");
    }
    const isOwner = await channelRepository.checkChannelOwnership(
      channelId,
      adminId,
    );
    if (!isOwner) {
      throw createError(
        403,
        "Доступ запрещен. Вы не являетесь владельцем этого канала.",
      );
    }

    const [channel, dashboardStats, transactions] = await Promise.all([
      channelRepository.getChannelById(channelId),
      channelRepository.getChannelDashboardData(channelId),
      paymentRepository.getTransactions(channelId, 10),
    ]);

    if (!channel) {
      throw createError(404, "Канал не найден.");
    }
    return {
      channel,
      ...dashboardStats,
      transactions,
    };
  }

  async linkBotToChannel(adminId, channelId, botToken) {
    if (!adminId) {
      throw createError(400, "Не передан ID пользователя Telegram.");
    }
    if (!botToken) {
      throw createError(400, "Не передан токен бота.");
    }
    const isOwner = await channelRepository.checkChannelOwnership(
      channelId,
      adminId,
    );
    if (!isOwner) {
      throw createError(
        403,
        "Доступ запрещен. Вы не являетесь владельцем этого канала.",
      );
    }

    let botUsername = "";

    try {
      const tgResponse = await axios.get(
        `https://api.telegram.org/bot${botToken}/getMe`,
      );

      if (tgResponse.data && tgResponse.data.ok) {
        botUsername = tgResponse.data.result.username;
      } else {
        throw createError(
          400,
          "Telegram API вернул ошибку при валидации токена.",
        );
      }
    } catch (error) {
      console.error("💥 Ошибка валидации бота в Telegram API:", error.message);
      throw createError(
        400,
        "Неверный токен бота. Пожалуйста, проверьте данные в @BotFather.",
      );
    }
    const updatedChannel = await channelRepository.updateChannel(channelId, {
      bot_token: botToken,
      bot_username: botUsername,
    });

    try {
      await botManager.addBot(channelId, botToken);
      const targetUrl = `${process.env.FRONTEND_URL}/pay/${channelId}`;
      await axios.post(
        `https://api.telegram.org/bot${botToken}/setChatMenuButton`,
        {
          menu_button: {
            type: "web_app",
            text: "Открыть витрину",
            web_app: {
              url: targetUrl,
            },
          },
        },
      );
      console.log(
        `🤖 Кнопка меню для бота канала ${channelId} успешно настроена!`,
      );
    } catch (err) {
      console.error("💥 Ошибка настройки кнопки меню через API:", err.message);
      throw createError(400, "Ошибка настройки бота");
    }

    return updatedChannel;
  }

  async getChannelPlansForAdmin(channelId, adminId) {
    if (!channelId || !adminId) {
      throw createError(400, "Не переданы обязательные параметры запроса.");
    }

    const isOwner = await channelRepository.checkChannelOwnership(
      channelId,
      adminId,
    );
    if (!isOwner) {
      throw createError(
        403,
        "Доступ запрещен. Вы не являетесь владельцем этого канала.",
      );
    }

    const tariffs =
      await channelRepository.findActiveTariffsByChannelId(channelId);
    return tariffs;
  }

  async createNewChannelPlan(adminId, channelId, planData) {
    const { title, durationDays, price, currencyId } = planData;

    if (!title || title.trim() === "") {
      throw createError(400, "Название тарифа обязательно для заполнения");
    }
    if (price < 1) {
      throw createError(400, "Минимальная цена тарифа - 1 доллар.");
    }

    const isOwner = await channelRepository.checkChannelOwnership(
      channelId,
      adminId,
    );
    if (!isOwner) {
      throw createError(
        403,
        "Доступ запрещен. Вы не являетесь владельцем этого канала.",
      );
    }

    const newTariff = await platformServicesRepository.insert(
      channelId,
      planData,
    );

    return newTariff;
  }

  async removeTariffPlan(tariffId, adminTgId) {
    if (!tariffId || !adminTgId) {
      throw createError(400, "Не переданы обязательные параметры запроса.");
    }

    const hasAccess = await channelRepository.checkTariffOwnership(
      tariffId,
      adminTgId,
    );
    if (!hasAccess) {
      throw createError(404, "Тариф не найден или у вас нет прав");
    }

    await channelRepository.softDeleteTariff(tariffId);

    return true;
  }

  async getPublicChannelTariffs(channelId) {
    if (!channelId) {
      throw createError(400, "Не переданы обязательные параметры запроса.");
    }

    const channel = await channelRepository.findChannelById(channelId);
    if (!channel) {
      throw createError(404, "Канал не найден");
    }

    const tariffs =
      await platformServicesRepository.findActiveServicesByChannelId(channelId);

    return {
      channelTitle: channel.title,
      tariffs: tariffs || [],
    };
  }

  async connectNewChannel(tgChannelId, channelTitle, adminId) {
    const botMember = await bot.telegram.getChatMember(
      tgChannelId,
      bot.botInfo.id,
    );

    if (
      botMember.status !== "administrator" &&
      botMember.status !== "creator"
    ) {
      throw new Error("BOT_NOT_ADMIN");
    }

    const userMember = await bot.telegram
      .getChatMember(tgChannelId, adminId)
      .catch(() => null);

    if (
      !userMember ||
      (userMember.status !== "administrator" && userMember.status !== "creator")
    ) {
      throw new Error("USER_NOT_ADMIN");
    }

    return await channelRepository.upsertChannel(
      adminId,
      tgChannelId,
      channelTitle,
    );
  }

  async getChannelStats(channelId, period) {
    const allowedPeriods = ["7d", "30d", "all"];
    if (!allowedPeriods.includes(period)) {
      throw createError(
        400,
        "Невалидный период. Разрешено только: 7d, 30d, all",
      );
    }

    const stats = await channelRepository.getStatsByPeriod(channelId, period);

    return stats;
  }
}

export const channelService = new ChannelService();
