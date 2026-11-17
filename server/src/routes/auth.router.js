import { Router } from "express";
import { handleAuth } from "../controllers/auth.controller.js";
import { verifyTelegramWebAppData } from "../middlewares/auth.js";

const router = Router();

router.post("/", verifyTelegramWebAppData, handleAuth);

export default router;
