import { channelService } from "../../services/channel.service.js";
import { messages } from "../bot.messages.js";

export const forwardHandler = async (ctx) => {
  const forwardChat = ctx.message.forward_from_chat;

  if (!forwardChat) {
    return await ctx.reply(messages.forwardInstructions);
  }

  const tgChannelId = forwardChat.id;
  const channelTitle = forwardChat.title;
  const chatType = forwardChat.type;
  const adminId = ctx.from.id;
  if (
    chatType !== "channel" &&
    chatType !== "group" &&
    chatType !== "supergroup"
  ) {
    return await ctx.reply(messages.forwardInstructions);
  }
  await ctx.sendChatAction("typing");

  try {
    await channelService.connectNewChannel(tgChannelId, channelTitle, adminId);

    await ctx.reply(messages.channelConnectedSuccess(channelTitle));
  } catch (error) {
    if (error.message === "BOT_NOT_ADMIN") {
      return await ctx.reply(messages.botNotAdmin(channelTitle));
    }
    if (error.message === "USER_NOT_ADMIN") {
      return await ctx.reply(messages.userNotAdmin(channelTitle));
    }

    console.error("❌ Ошибка при привязке канала через пост:", error.message);
    await ctx.reply(messages.channelConnectError);
  }
};
