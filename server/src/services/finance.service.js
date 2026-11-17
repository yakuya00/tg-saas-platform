import createError from "http-errors";
import { cryptoPay } from "../config/cryptoPay.js";
import { financeRepository } from "../repositories/finance.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { runTransaction } from "../utils/dbUtils.js";
import { paymentRepository } from "../repositories/payment.repository.js";

class FinanceService {
  async executeWithdraw(amount, adminTgId) {
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount < 5) {
      throw createError(
        400,
        "Минимальная сумма для вывода средств составляет $5.00",
      );
    }

    const user = await userRepository.findById(adminTgId);
    if (!user) {
      return false;
    }

    const transferAsset = "USDT";
    let isUsdtSubtracted = false;

    if (parseFloat(user.balance_available) < withdrawAmount) {
      throw createError(400, "Недостаточно USDT на балансе.");
    }
    let withdrawalRecordId = null;
    let currencyId = 2;

    await runTransaction(async (txClient) => {
      await userRepository.deductBalanceByUserId(adminTgId, amount, txClient);
      const initialRecord = await financeRepository.createWithdrawalRecord({
        adminTgId: adminTgId,
        amount: withdrawAmount,
        currencyId: currencyId,
      });
      withdrawalRecordId = initialRecord.id;
    });

    isUsdtSubtracted = true;
    const spendId = `spend_${withdrawAmount}_${Date.now()}_${adminTgId}`;

    try {
      const transfer = await cryptoPay.transfer(
        parseInt(adminTgId),
        transferAsset,
        withdrawAmount,
        spendId,
      );

      if (!transfer) {
        throw new Error("GATEWAY_REJECTED");
      }

      await financeRepository.createWithdrawalRecord({
        id: withdrawalRecordId,
        status: "success",
      });

      return {
        success: true,
        message: `🔥 Бабки улетели моментально! Вы получили ${withdrawAmount} USDT прямо на свой долларовый баланс в Crypto Bot.`,
      };
    } catch (apiError) {
      console.error(
        "❌ КРАХ АПИ КРИПТОБОТА ИЛИ ПОСЛЕДУЮЩЕГО КОДА:",
        apiError.message,
      );

      const isIdentifiedApiError =
        apiError.message.includes("INSUFFICIENT_FUNDS") ||
        apiError.message.includes("USER_NOT_FOUND");

      if (isUsdtSubtracted && isIdentifiedApiError) {
        console.log(
          `🔄 [ОТКАТ БАЛАНСА] Криптобот отклонил платеж. Возвращаем $${withdrawAmount} USDT юзеру #${adminTgId}`,
        );

        await runTransaction(async (txClient) => {
          await userRepository.updateBalanceByUserId(
            adminTgId,
            withdrawAmount,
            txClient,
          );
          await financeRepository.createWithdrawalRecord(
            { id: withdrawalRecordId, status: "failed" },
            txClient,
          );
        });

        throw createError(
          400,
          `Ошибка выплаты: ${apiError.message}. Средства вернулись на баланс.`,
        );
      }

      if (withdrawalRecordId) {
        await financeRepository.createWithdrawalRecord({
          id: withdrawalRecordId,
          status: "error_check",
        });
      }

      throw createError(
        500,
        "Заявка зависла в обработке. Проверяем статус платежа. Если деньги не пришли — обратитесь в поддержку.",
      );
    }
  }
}

export const financeService = new FinanceService();
