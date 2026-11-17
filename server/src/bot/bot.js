import { Telegraf } from "telegraf";
import { startCommand } from "./commands/start.command.js";
import { successfulPaymentHandler } from "./handlers/stars.handler.js";
import { preCheckoutHandler } from "./handlers/checkout.handler.js";
import { forwardHandler } from "./handlers/forward.handler.js";
import { chatMemberHandler } from "./handlers/chatMember.handler.js";
import { channelService } from "../services/channel.service.js";
import { paymentService } from "../services/payment.service.js";

import { messages } from "./bot.messages.js";

if (!process.env.BOT_TOKEN) {
  console.error(
    "❌ КРИТИЧЕСКАЯ ОШИБКА: BOT_TOKEN не найден в переменных окружения (.env)!",
  );
}

export const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start(startCommand);
bot.on("successful_payment", successfulPaymentHandler);
bot.on("chat_member", chatMemberHandler);

bot.command("bind", async (ctx) => {
  const chatId = ctx.chat.id;
  const chatType = ctx.chat.type;
  const chatTitle = ctx.chat.title;
  const adminId = ctx.from.id;

  if (chatType !== "group" && chatType !== "supergroup") {
    return await ctx.reply(
      "❌ Эту команду нужно вызывать внутри Telegram-группы, которую вы хотите подключить.",
    );
  }

  await ctx.sendChatAction("typing");

  try {
    const member = await ctx.telegram
      .getChatMember(chatId, adminId)
      .catch(() => null);

    if (
      !member ||
      (member.status !== "creator" && member.status !== "administrator")
    ) {
      return await ctx.reply(
        "❌ Подключить группу может только её создатель или администратор.",
      );
    }

    await channelService.connectNewChannel(chatId, chatTitle, adminId);

    await ctx.reply(
      `✅ Группа *${chatTitle}* успешно подключена к вашей панели управления! Теперь вы можете продавать сюда доступ через Mini App.`,
      {
        parse_mode: "Markdown",
      },
    );
  } catch (error) {
    if (error.message === "BOT_NOT_ADMIN") {
      return await ctx.reply(
        "❌ Бот не является администратором в этой группе. Дайте боту права администратора и повторите команду.",
      );
    }

    console.error("❌ Ошибка при привязке группы через /bind:", error.message);
    await ctx.reply(
      "❌ Произошла ошибка при подключении группы. Попробуйте позже.",
    );
  }
});

bot.on("message", async (ctx, next) => {
  if (ctx.message?.successful_payment) {
    return next();
  }

  if (ctx.chat?.type === "group" || ctx.chat?.type === "supergroup") {
    return next();
  }
  console.log(ctx.message);
  if (ctx.message?.forward_from_chat) {
    return await forwardHandler(ctx);
  }

  if (ctx.message?.refunded_payment) {
    const refundInfo = ctx.message.refunded_payment;
    const chargeId = refundInfo.telegram_payment_charge_id;

    console.warn(
      `🚨 [REFUND DETECTED] Юзер ${ctx.from.id} отменил платеж! Charge ID: ${chargeId}`,
    );

    try {
      await paymentService.handleStarsRefund(chargeId);
    } catch (error) {
      console.error("❌ Ошибка при обработке возврата звёзд:", error.message);
    }
    return;
  }

  return await ctx.reply(messages.forwardInstructions);
});

bot.on("pre_checkout_query", preCheckoutHandler);

export async function startBot() {
  try {
    bot.botInfo = await bot.telegram.getMe();
    bot.launch({
      allowedUpdates: [
        "message",
        "callback_query",
        "chat_member",
        "chat_join_request",
        "pre_checkout_query",
        "successful_payment",
      ],
    });
    console.log("🚀 Telegram Bot успешно запущен и слушает посты!");

    process.once("SIGINT", () => bot.stop("SIGINT"));
    process.once("SIGTERM", () => bot.stop("SIGTERM"));
  } catch (err) {
    console.error("❌ Не удалось запустить бота:", err.message);
    throw err;
  }
}
