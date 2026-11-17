import asyncHandler from "express-async-handler";
import { channelService } from "../services/channel.service.js";
import { platformServicesRepository } from "../repositories/platformServices.repository.js";
import { promoCodeService } from "../services/promoCode.service.js";
import { giveawayService } from "../services/giveaway.service.js";

export const getCountMyChannels = asyncHandler(async (req, res) => {
  const adminTgId = req.tgUser.id;

  const count = await channelService.getAdminChannelsCount(adminTgId);

  return res.json({
    success: true,
    count: count,
  });
});

export const getMyChannels = asyncHandler(async (req, res) => {
  const adminId = req.tgUser.id;

  const channels = await channelService.getAdminChannels(adminId);

  res.json({
    success: true,
    ...channels,
  });
});

export const getChannelData = asyncHandler(async (req, res) => {
  const adminId = req.tgUser.id;
  const channelId = req.params.channelId;
  const dashboardData = await channelService.getChannelData(adminId, channelId);
  res.json({
    success: true,
    ...dashboardData,
  });
});

export const linkBotToChannel = asyncHandler(async (req, res) => {
  const botToken = req.body.botToken;
  const adminId = req.tgUser.id;
  const channelId = req.params.channelId;
  const updatedChannel = await channelService.linkBotToChannel(
    adminId,
    channelId,
    botToken,
  );
  res.json({
    success: true,
    channel: {
      id: updatedChannel.id,
      bot_token: updatedChannel.bot_token,
      bot_username: updatedChannel.bot_username,
    },
  });
});

export const getServicesForChannel = asyncHandler(async (req, res) => {
  const adminId = req.tgUser.id;
  const { channelId } = req.params;

  const services =
    await platformServicesRepository.findActiveServicesByChannelId(channelId);

  return res.json({
    success: true,
    services,
  });
});

export const createPlan = asyncHandler(async (req, res) => {
  const adminId = req.tgUser.id;
  const channelId = req.params.channelId;

  const newService = await channelService.createNewChannelPlan(
    adminId,
    channelId,
    req.body,
  );

  return res.status(201).json({
    success: true,
    service: newService,
  });
});

export const deleteTariff = asyncHandler(async (req, res) => {
  const { tariffId } = req.params;
  const adminTgId = req.tgUser.id;

  await channelService.removeTariffPlan(tariffId, adminTgId);

  return res.json({
    success: true,
    message: "Тариф успешно удален и скрыт от пользователей.",
  });
});

export const getPublicPlansForChannel = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const data = await channelService.getPublicChannelTariffs(channelId);

  return res.json({
    success: true,
    ...data,
  });
});

export const getChannelStats = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { period = "7d" } = req.query;

  const data = await channelService.getChannelStats(channelId, period);

  return res.json(data);
});

export const getCoupons = asyncHandler(async (req, res) => {
  const adminId = req.tgUser.id;
  const channelId = req.params.channelId;

  const coupons = await promoCodeService.getChannelCoupons(adminId, channelId);

  res.json({
    success: true,
    coupons,
  });
});

export const createCoupon = asyncHandler(async (req, res) => {
  const adminId = req.tgUser.id;
  const channelId = req.params.channelId;

  const newCoupon = await promoCodeService.createChannelCoupon(
    adminId,
    channelId,
    req.body,
  );

  res.status(201).json({
    success: true,
    coupon: newCoupon,
  });
});

export const getGiveaways = asyncHandler(async (req, res) => {
  const adminId = req.tgUser.id;
  const channelId = req.params.channelId;

  const giveaways = await giveawayService.getChannelGiveaways(
    adminId,
    channelId,
  );
  res.json({
    success: true,
    giveaways,
  });
});

export const createGiveaway = asyncHandler(async (req, res) => {
  const adminId = req.tgUser.id;
  const channelId = req.params.channelId;

  const newGiveaway = await giveawayService.createGiveaway(
    adminId,
    channelId,
    req.body,
  );

  res.status(201).json({
    success: true,
    giveaway: newGiveaway,
  });
});
