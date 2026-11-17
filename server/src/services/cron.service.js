import { subscriptionRepository } from "../repositories/subscription.repository.js";
import { customerRepository } from "../repositories/customer.repository.js";
import { channelRepository } from "../repositories/channel.repository.js";
import { runTransaction } from "../utils/dbUtils.js";
import { bot } from "../bot/bot.js";
import { messages } from "../bot/bot.messages.js";
import { botManager } from "./botManager.service.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class CronService {
  async processExpiredSubscriptions() {
    try {
      await runTransaction(async (txClient) => {
        const expiredSubs =
          await subscriptionRepository.getExpiredSubscriptions(txClient);

        if (expiredSubs.length === 0) {
          console.log("👉 Нет просроченных подписок для удаления.");
          return;
        }

        console.log(
          `🧹 [CRON] Найдено ${expiredSubs.length} подписок. Начинаем зачистку...`,
        );

        const notifiedChannels = new Set();

        for (const sub of expiredSubs) {
          console.log(
            `🚫 У юзера ${sub.user_tg_id} истекла подписка. Кикаем...`,
          );

          let isSkippedByTelegramError = false;

          try {
            await bot.telegram.banChatMember(sub.tg_channel_id, sub.user_tg_id);
            await delay(150);
            await bot.telegram.unbanChatMember(
              sub.tg_channel_id,
              sub.user_tg_id,
            );
          } catch (tgError) {
            const errMsg = tgError.message.toLowerCase();
            console.warn(`⚠️ Ошибка API на юзере ${sub.user_tg_id}: ${errMsg}`);

            if (
              errMsg.includes("chat admin info_required") ||
              errMsg.includes("chat_admin_required") ||
              errMsg.includes("not enough rights") ||
              errMsg.includes("bot_is_not_member")
            ) {
              isSkippedByTelegramError = true;

              if (!notifiedChannels.has(sub.channel_id)) {
                try {
                  await bot.telegram.sendMessage(
                    sub.admin_id,
                    `🚨 <b>Внимание, босс! Критическая ошибка автоматизации!</b>\n\n` +
                      `У пользователя с ID <code>${sub.user_tg_id}</code> истек срок подписки на твой канал <b>${sub.channel_title}</b>.\n\n` +
                      `❌ Я не смог удалить его, потому что <b>у меня нет прав администратора</b> (требуется право на блокировку пользователей).\n\n` +
                      `👉 Пожалуйста, зайди в настройки канала и выдай мне нужные права, иначе халявщики будут сидеть в канале бесплатно!`,
                    { parse_mode: "HTML" },
                  );
                  notifiedChannels.add(sub.channel_id);
                } catch (adminMsgErr) {
                  console.error(`🔴 Не удалось достучаться до админа...`);
                }
              }
            }
          }

          if (isSkippedByTelegramError) {
            await delay(300);
            continue;
          }

          try {
            await subscriptionRepository.updateStatusToExpired(
              sub.sub_id,
              txClient,
            );
            await customerRepository.updateCustomerActivity(
              sub.channel_id,
              sub.user_tg_id,
              false,
              txClient,
            );
            await channelRepository.upsertStats(
              sub.channel_id,
              { amount: 0, type: "expire" },
              txClient,
            );
          } catch (dbError) {
            console.error(
              `🚨 Ошибка записи в БД для юзера ${sub.user_tg_id}:`,
              dbError.message,
            );
            throw dbError;
          }

          try {
            await botManager
              .getBot(sub.channel_id)
              .telegram.sendMessage(
                sub.user_tg_id,
                messages.subscriptionExpiredNotify(sub.channel_title),
                { parse_mode: "HTML" },
              );
          } catch (msgError) {}

          await delay(300);
        }
      });
    } catch (error) {
      console.error(
        "❌ Ошибка в процессе очистки просроченных подписок:",
        error.message,
      );
    }
  }

  async sendExpirationReminders() {
    try {
      const remindSubs =
        await subscriptionRepository.getSubscriptionsForReminder();

      if (remindSubs.length === 0) {
        console.log("👉 Нет юзеров для отправки напоминаний за 3 дня.");
        return;
      }

      for (const sub of remindSubs) {
        try {
          await subscriptionRepository.setReminderFlagTrue(sub.sub_id);

          const formattedDate = new Date(sub.expires_at).toLocaleDateString(
            "ru-RU",
          );
          const botUsername = bot.botInfo?.username || "твой_бот";

          await bot.telegram.sendMessage(
            sub.user_tg_id,
            messages.subscriptionExpirationReminder(
              sub.channel_title,
              formattedDate,
            ),
            {
              parse_mode: "HTML",
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: messages.renewSubscriptionButton,
                      url: `https://t.me/${botUsername}/app?startapp=${sub.channel_id}`,
                    },
                  ],
                ],
              },
            },
          );

          console.log(
            `📩 Отправлено напоминание юзеру ${sub.user_tg_id} о канале "${sub.channel_title}"`,
          );
          await delay(300);
        } catch (tgError) {
          console.error(
            `Не удалось отправить напоминание юзеру ${sub.user_tg_id}:`,
            tgError.message,
          );
        }
      }
    } catch (error) {
      console.error(
        "❌ Ошибка в процессе рассылки напоминаний:",
        error.message,
      );
    }
  }
}

export const cronService = new CronService();
