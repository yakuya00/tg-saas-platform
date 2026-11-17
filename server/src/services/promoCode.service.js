import { channelRepository } from "../repositories/channel.repository.js";
import { promoCodeRepository } from "../repositories/promoCode.repository.js";
import createError from "http-errors";
class PromoCodeService {
  async getChannelCoupons(adminId, channelId) {
    if (!adminId)
      throw createError(400, "Не передан ID пользователя Telegram.");

    const isOwner = await channelRepository.checkChannelOwnership(
      channelId,
      adminId,
    );
    if (!isOwner)
      throw createError(403, "Доступ запрещен. Вы не владелец канала.");

    return await promoCodeRepository.getCouponsByChannel(channelId);
  }

  async createChannelCoupon(adminId, channelId, couponData) {
    if (!adminId)
      throw createError(400, "Не передан ID пользователя Telegram.");

    const isOwner = await channelRepository.checkChannelOwnership(
      channelId,
      adminId,
    );
    if (!isOwner)
      throw createError(403, "Доступ запрещен. Вы не владелец канала.");

    console.log(couponData);
    const { code, discount_type, discount_value } = couponData;
    if (!code || !discount_type || !discount_value) {
      throw createError(
        400,
        "Заполните обязательные поля: код, тип и размер скидки.",
      );
    }

    return await promoCodeRepository.createCoupon(channelId, couponData);
  }
}

export const promoCodeService = new PromoCodeService();
