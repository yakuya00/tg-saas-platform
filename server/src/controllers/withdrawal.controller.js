import asyncHandler from "express-async-handler";
import { financeService } from "../services/finance.service.js";
import { financeRepository } from "../repositories/finance.repository.js";

export const requestWithdraw = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const adminTgId = req.tgUser.id;

  const result = await financeService.executeWithdraw(amount, adminTgId);

  return res.json({
    success: true,
    message: result.message,
  });
});

export const getGlobalFinanceStats = asyncHandler(async (req, res) => {
  const adminTgId = req.tgUser.id;

  const [totalUsdt, balancesData, historyRows] = await Promise.all([
    financeRepository.getTotalUsdtBalance(adminTgId),
    financeRepository.getAvailableUSDTBalance(adminTgId),
    financeRepository.getRecentTransactions(adminTgId),
  ]);

  if (!balancesData) {
    throw createError(500, "Не удалось рассчитать финансовую статистику");
  }

  return res.json({
    success: true,
    balances: {
      totalUsdt: balancesData.totalUsdt,
      available: balancesData.available,
      inHold: balancesData.inHold,
      totalEarned: balancesData.totalEarned,
      hasHold: balancesData.hasHold,
    },
    transactions: historyRows,
  });
});
