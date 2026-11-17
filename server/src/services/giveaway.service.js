import { giveawayRepository } from "../repositories/giveaway.repository.js";
import { channelRepository } from "../repositories/channel.repository.js";
import createError from "http-errors";

class GiveawaysService {
  async getChannelGiveaways(adminId, channelId) {
    if (!adminId)
      throw createError(400, "Не передан ID пользователя Telegram.");

    const isOwner = await channelRepository.checkChannelOwnership(
      channelId,
      adminId,
    );
    if (!isOwner)
      throw createError(403, "Доступ запрещен. Вы не владелец канала.");

    return await giveawayRepository.getGiveawaysByChannel(channelId);
  }

  async createGiveaway(adminId, channelId, giveawayData) {
    if (!adminId)
      throw createError(400, "Не передан ID пользователя Telegram.");

    const isOwner = await channelRepository.checkChannelOwnership(
      channelId,
      adminId,
    );
    if (!isOwner)
      throw createError(403, "Доступ запрещен. Вы не владелец канала.");

    const { title, service_id, winners_count, duration_days } = giveawayData;
    if (!title || !service_id || !winners_count || !duration_days) {
      throw createError(400, "Заполните обязательные поля.");
    }

    return await giveawayRepository.createGiveaway(channelId, giveawayData);
  }
}

export const giveawayService = new GiveawaysService();
