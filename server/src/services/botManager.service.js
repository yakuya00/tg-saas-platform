import { Telegraf } from "telegraf";
import { channelRepository } from "../repositories/channel.repository.js";

class BotManagerService {
  constructor() {
    this.activeBots = new Map();
    this.tokenToChannel = new Map();
  }

  async removeBot(channelId) {
    const id = Number(channelId);
    if (this.activeBots.has(id)) {
      const oldBot = this.activeBots.get(id);
      const botToken = oldBot.telegram.token;

      try {
        await oldBot.stop();
        console.log(`🛑 Long Polling для бота ${id} остановлен.`);
      } catch (e) {
        console.error(`Не удалось корректно остановить бота ${id}:`, e.message);
      }

      this.clearBotFromMemory(id, botToken);
    }
  }

  clearBotFromMemory(channelId, botToken) {
    const id = Number(channelId);
    this.activeBots.delete(id);
    if (botToken) {
      this.tokenToChannel.delete(botToken);
    }
  }

  async addBot(channelId, botToken) {
    const id = Number(channelId);
    try {
      if (this.tokenToChannel.has(botToken)) {
        const existingChannelId = this.tokenToChannel.get(botToken);

        console.log(
          `⚠️ Токен уже юзается в канале ${existingChannelId}. Гасим старый инстанс...`,
        );
        await this.removeBot(existingChannelId);
      }

      if (this.activeBots.has(id)) {
        return this.activeBots.get(id);
      }

      const bot = new Telegraf(botToken);

      bot.start((ctx) => {
        const botName = ctx.botInfo.first_name;

        return ctx.reply(
          `👋 <b>Добро пожаловать в ${botName}!</b>\n\n` +
            `Здесь вы можете приобрести или продлить доступ к нашим приватным каналам и закрытым материалам.\n\n` +
            `🛍️ <b>Вся витрина с тарифами, скидками и оплатой (USDT / Звёзды) уже доступна по кнопке ниже:</b>`,
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "🛍️ Открыть витрину",
                    web_app: {
                      url: `${process.env.FRONTEND_URL}/pay/${channelId}`,
                    },
                  },
                ],
              ],
            },
          },
        );
      });
      await bot.telegram.deleteWebhook({ drop_pending_updates: true });

      this.activeBots.set(id, bot);
      this.tokenToChannel.set(botToken, id);

      bot.launch().catch((err) => {
        console.error(`💥 Ошибка рантайма бота ${id}:`, err.message);
        this.clearBotFromMemory(id, botToken);
      });

      console.log(`🚀 Бот для канала ${id} успешно запущен!`);
      return bot;
    } catch (error) {
      console.error(`💥 Не удалось запустить бота:`, error.message);
      this.clearBotFromMemory(id, botToken);
      throw error;
    }
  }

  async initAllBots() {
    console.log(
      "🤖 [BotManager] Начинаем инициализацию кастомных ботов из базы данных...",
    );

    try {
      const activeChannels = await channelRepository.findAllActiveTokens();

      if (!activeChannels || activeChannels.length === 0) {
        console.log(
          "ℹ️ [BotManager] Активных ботов в базе данных не обнаружено.",
        );
        return;
      }

      console.log(
        `📦 [BotManager] Найдено каналов с настроенными ботами: ${activeChannels.length}`,
      );

      for (const channel of activeChannels) {
        console.log(
          `⏳ [BotManager] Запуск бота для канала ID: ${channel.id}...`,
        );
        await this.addBot(channel.id, channel.bot_token);
      }

      console.log(
        "🏁 [BotManager] Все активные боты успешно подняты и готовы к работе!",
      );
    } catch (error) {
      console.error(
        "💥 [BotManager] Критическая ошибка при массовом запуске ботов:",
        error.message,
      );
    }
  }

  getBot(channelId) {
    return this.activeBots.get(Number(channelId));
  }
}

export const botManager = new BotManagerService();
