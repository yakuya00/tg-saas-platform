import { subscriptionRepository } from "../repositories/subscription.repository.js";
import { botManager } from "./botManager.service.js";
import { bot } from "../bot/bot.js";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class SubscriptionService {
  async handleUserJoin(realUserTgId, inviteLinkUsed, channelTgId) {
    console.log(
      `[🔗 Фиксация входа] Юзер ${realUserTgId} зашел по ссылке ${inviteLinkUsed}`,
    );

    const processedLink = inviteLinkUsed.replace("...", "");

    const activatedSub =
      await subscriptionRepository.activateSubscriptionByLink(
        realUserTgId,
        processedLink,
      );

    if (activatedSub) {
      console.log(
        `✅ Подписка #${activatedSub.id} успешно зафиксирована за юзером ${realUserTgId}`,
      );
      return activatedSub;
    } else {
      console.error(
        `🚨 КРИТИЧЕСКИ: Юзер ${realUserTgId} зашел по левой ссылке в канал ${channelTgId}! Запускаем процедуру ликвидации...`,
      );

      try {
        await bot.telegram.banChatMember(channelTgId, realUserTgId);
        await delay(150);
        await bot.telegram.unbanChatMember(channelTgId, realUserTgId);

        console.log(`🧹 Халявщик ${realUserTgId} успешно удален из канала.`);

        try {
          await botManager
            .getBot(channelTgId)
            .telegram.sendMessage(
              realUserTgId,
              `⚠️ <b>Доступ ограничен!</b>\n\nВы попытались войти в приватный канал по недействительной или устаревшей ссылке.\n\n👉 Чтобы получить доступ, пожалуйста, оплатите подписку через нашего официального бота.`,
              { parse_mode: "HTML" },
            );
        } catch (msgErr) {}
      } catch (tgError) {
        console.error(
          `🚨 Не удалось кикнуть левого юзера ${realUserTgId}:`,
          tgError.message,
        );
      }
    }
  }
}

export const subscriptionService = new SubscriptionService();
