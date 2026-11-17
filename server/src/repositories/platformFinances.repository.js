import pool from "../config/db.js";

class PlatformFinances {
  async updatePlatformBalance(
    totalInvoiceAmount,
    platformProfit,
    txClient = pool,
  ) {
    const query = `
      UPDATE platform_finances 
      SET total_revenue_usdt = total_revenue_usdt + $1,
          available_to_withdraw = available_to_withdraw + $2
      WHERE id = 1;
    `;
    await txClient.query(query, [totalInvoiceAmount, platformProfit]);
  }

  async reversePlatformBalance(totalPaid, platformProfit, txClient = pool) {
    if (totalPaid === undefined || platformProfit === undefined) {
      throw new Error(
        "⛔ [PLATFORM FINANCES ERROR] Не переданы параметры totalPaid или platformProfit для реверса",
      );
    }

    const amountPaid = parseFloat(totalPaid);
    const amountProfit = parseFloat(platformProfit);

    if (
      isNaN(amountPaid) ||
      isNaN(amountProfit) ||
      amountPaid < 0 ||
      amountProfit < 0
    ) {
      throw new Error(
        `⛔ [PLATFORM FINANCES ERROR] Некорректные суммы для реверса кассы: paid=${totalPaid}, profit=${platformProfit}`,
      );
    }

    const queryText = `
      UPDATE platform_finances 
      SET 
        total_revenue_usdt = total_revenue_usdt - $1,
      WHERE id = 1
      RETURNING total_revenue_usdt;
    `;

    try {
      const { rows } = await txClient.query(queryText, [amountPaid]);

      if (rows.length === 0) {
        console.warn(
          "⚠️ [PLATFORM FINANCES] Глобальная строка финансовой статистики (id=1) не найдена в базе!",
        );
        return null;
      }

      console.log(
        `📉 [PLATFORM CASH REVERSE] Касса платформы скорректирована: Оборот: -$${amountPaid}, Прибыль платформы: -$${amountProfit}.`,
      );
      return rows[0];
    } catch (error) {
      console.error(
        "❌ [PLATFORM FINANCES ERROR] Крах при выполнении reversePlatformBalance:",
        error.message,
      );
      throw error;
    }
  }
}

export const platformFinances = new PlatformFinances();
