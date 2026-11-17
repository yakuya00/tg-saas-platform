import { Router } from "express";
import { getMe } from "../controllers/user.controller.js";
import { verifyTelegramWebAppData } from "../middlewares/auth.js";

const router = Router();

router.get("/me", verifyTelegramWebAppData, getMe);

export default router;
