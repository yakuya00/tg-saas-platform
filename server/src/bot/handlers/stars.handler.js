import { paymentService } from "../../services/payment.service.js";

export const successfulPaymentHandler = async (ctx) => {
  const paymentInfo = ctx.message.successful_payment;
  const chargeId = paymentInfo.telegram_payment_charge_id;

  const invoicePayload = paymentInfo.invoice_payload;

  console.log(
    `⭐️ [WEBHOOK STARS] Платёж принят! Charge ID: ${chargeId}. Обрабатываем инвойс...`,
  );

  try {
    const success = await paymentService.handleSuccessfulStarsPayment(
      invoicePayload,
      chargeId,
    );

    if (!success) {
      console.warn(
        `⚠️ [WEBHOOK STARS] Платеж с payload ${invoicePayload} не был успешно обработан сервисом.`,
      );
    }

    return;
  } catch (error) {
    console.error(
      "❌ Крах при обработке успешного платежа за Звёзды в хендлере:",
      error.message,
    );

    try {
      await ctx.reply(
        "⚠️ Произошла ошибка при автоматической выдаче подписки. Пожалуйста, обратитесь в поддержку, ваш платеж зафиксирован.",
      );
    } catch (sendErr) {
      console.error(
        "Не удалось отправить сообщение об ошибке юзеру:",
        sendErr.message,
      );
    }
  }
};
