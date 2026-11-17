import cron from "node-cron";
import { cronService } from "../services/cron.service.js";
import pool from "../config/db.js";
import { runTransaction } from "../utils/dbUtils.js";

export const initSubscriptionWorker = () => {
  cron.schedule("*/3 * * * *", async () => {
    console.log("⏳ [Cron Worker] Запуск 3минутной проверки подписок...");

    await cronService.processExpiredSubscriptions();
    //await cronService.sendExpirationReminders();

    console.log("✅ [Cron Worker] Проверка успешно завершена.");
  });

  // cron.schedule("5 0 * * *", async () => {
  cron.schedule("*/1 * * * *", async () => {
    console.log("💰 [CRON] Запуск разморозки балансов из холда...");

    try {
      await runTransaction(async (txClient) => {
        const updatePaymentsQuery = `
        UPDATE payments p
        SET status = 'success'
        FROM channels c
        WHERE p.status = 'hold' 
          AND p.available_at <= NOW() 
          AND p.channel_id = c.id -- Твой реальный линк связки платежа с каналом
          AND p.gateway_id = (SELECT id FROM dictionary_gateways WHERE code = 'tg_stars')
        RETURNING p.id, c.admin_tg_id, p.net_amount, p.amount;
      `;

        const { rows: thawedPayments } =
          await txClient.query(updatePaymentsQuery);

        if (thawedPayments.length === 0) {
          console.log("ℹ️ [CRON] Нет платежей, готовых к разморозке.");
          return;
        }

        console.log(
          `🔍 [CRON] Найдено ${thawedPayments.length} платежей для разморозки.`,
        );

        let totalPlatformProfit = 0;

        const adminUpdates = {}; // admin_tg_id -> total_net_amount

        for (const payment of thawedPayments) {
          const profit = parseFloat(
            (
              parseFloat(payment.amount) - parseFloat(payment.net_amount)
            ).toFixed(4),
          );
          totalPlatformProfit += profit;

          const adminId = payment.admin_tg_id;

          if (!adminUpdates[adminId]) {
            adminUpdates[adminId] = 0;
          }
          adminUpdates[adminId] += parseFloat(payment.net_amount);
        }

        for (const [adminId, totalAmount] of Object.entries(adminUpdates)) {
          await txClient.query(
            `
          UPDATE users 
          SET 
            balance_hold = balance_hold - $1,
            balance_available = balance_available + $1
          WHERE tg_id = $2;
        `,
            [totalAmount, adminId],
          );

          console.log(
            `💸 [CRON] Разморожено $${totalAmount} для админа с TG ID: ${adminId}`,
          );
        }

        await txClient.query(
          `
        UPDATE platform_finances 
        SET available_to_withdraw = available_to_withdraw + $1 
        WHERE id = 1;
      `,
          [parseFloat(totalPlatformProfit.toFixed(4))],
        );

        console.log(
          `📈 [CRON] Баланс платформы пополнен на комиссионные: +$${totalPlatformProfit.toFixed(4)}`,
        );
      });

      console.log("✅ [CRON] Разморозка холдов успешно завершена.");
    } catch (error) {
      console.error("❌ [CRON] Крах воркера разморозки холдов:", error.message);
    }
  });
};
