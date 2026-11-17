import { Router } from "express";
import {
  getMyChannels,
  getServicesForChannel,
  createPlan,
  deleteTariff,
  getPublicPlansForChannel,
  getCountMyChannels,
  getChannelData,
  linkBotToChannel,
  getChannelStats,
  getCoupons,
  createCoupon,
  getGiveaways,
  createGiveaway,
} from "../controllers/channels.controller.js";
import { verifyTelegramWebAppData } from "../middlewares/auth.js";

const router = Router();

router.get("/", verifyTelegramWebAppData, getMyChannels);
router.get("/count", verifyTelegramWebAppData, getCountMyChannels);
router.get("/:channelId", verifyTelegramWebAppData, getChannelData);
router.get("/:channelId/stats", verifyTelegramWebAppData, getChannelStats);
router.get("/:channelId/coupons", verifyTelegramWebAppData, getCoupons);
router.get("/:channelId/giveaways", verifyTelegramWebAppData, getGiveaways);
router.post("/:channelId/giveaways", verifyTelegramWebAppData, createGiveaway);
router.post("/:channelId/coupons", verifyTelegramWebAppData, createCoupon);
router.post("/:channelId/bot", verifyTelegramWebAppData, linkBotToChannel);

router.get(
  "/:channelId/services",
  verifyTelegramWebAppData,
  getServicesForChannel,
);
router.get(
  "/public/:channelId/tariffs",
  verifyTelegramWebAppData,
  getPublicPlansForChannel,
);
router.post("/:channelId/plans", verifyTelegramWebAppData, createPlan);
router.delete("/plan/:tariffId", verifyTelegramWebAppData, deleteTariff);

export default router;
