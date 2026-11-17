import { Router } from "express";
import {
  createInvoice,
  cryptoBotWebhook,
  getCurrencies,
} from "../controllers/payment.controller.js";
import { verifyTelegramWebAppData } from "../middlewares/auth.js";

const router = Router();

router.get("/currencies", verifyTelegramWebAppData, getCurrencies);
router.post("/create", verifyTelegramWebAppData, createInvoice);
router.post("/webhook", cryptoBotWebhook);

export default router;
