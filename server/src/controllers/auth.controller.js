import asyncHandler from "express-async-handler";
import { authService } from "../services/auth.service.js";

export const handleAuth = asyncHandler(async (req, res) => {
  const tgUser = req.tgUser;
  const startParam = req.tgStartParam;

  const user = await authService.authUser(tgUser, startParam);

  return res.status(200).json({
    success: true,
    user: {
      tg_id: user.tg_id,
      username: user.username,
      balance: user.balance_available,
    },
  });
});
