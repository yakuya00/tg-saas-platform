import { Router } from "express";
import {
  getGlobalFinanceStats,
  requestWithdraw,
} from "../controllers/withdrawal.controller.js";
import { verifyTelegramWebAppData } from "../middlewares/auth.js";

const router = Router();

router.get("/stats", verifyTelegramWebAppData, getGlobalFinanceStats);
router.post("/withdraw/request", verifyTelegramWebAppData, requestWithdraw);

export default router;
