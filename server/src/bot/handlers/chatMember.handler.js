import { subscriptionService } from "../../services/subscription.service.js";

export const chatMemberHandler = async (ctx) => {
  const chatMemberUpdate = ctx.chatMember;

  const isNewMember = chatMemberUpdate.new_chat_member.status === "member";
  if (!isNewMember) return;

  const channelTgId = chatMemberUpdate.chat.id;
  const realUserTgId = chatMemberUpdate.new_chat_member.user.id;
  const inviteLinkUsed = chatMemberUpdate.invite_link?.invite_link;

  if (!inviteLinkUsed) return;

  try {
    await subscriptionService.handleUserJoin(
      realUserTgId,
      inviteLinkUsed,
      channelTgId,
    );
  } catch (error) {
    console.error(
      "❌ Ошибка при обработке входа в chat_member:",
      error.message,
    );
  }
};
