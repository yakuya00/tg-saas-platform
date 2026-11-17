import createError from "http-errors";
import { cryptoPay } from "../config/cryptoPay.js";
import { paymentRepository } from "../repositories/payment.repository.js";
import { platformServicesRepository } from "../repositories/platformServices.repository.js";
import { subscriptionRepository } from "../repositories/subscription.repository.js";
import { userRepository } from "../repositories/user.repository.js";
import { platformFinances } from "../repositories/platformFinances.repository.js";
import { customerRepository } from "../repositories/customer.repository.js";
import { runTransaction } from "../utils/dbUtils.js";
import { botManager } from "./botManager.service.js";
import { bot } from "../bot/bot.js";
import { channelRepository } from "../repositories/channel.repository.js";
import { calculateInvoiceSplit } from "../utils/finance.js";
import { calculateSubscriptionExtension } from "../utils/subscription.js";

class PaymentService {
  async processInvoiceGeneration(userTgId, serviceId, gatewayCode) {
    if (!userTgId || !serviceId || !gatewayCode) {
      throw createError(400, "Не переданы обязательные параметры для оплаты");
    }

    const service =
      await platformServicesRepository.findServiceWithDetails(serviceId);
    if (!service) throw createError(404, "Тариф не найден");

    const gatewayId = await paymentRepository.findGatewayIdByCode(gatewayCode);
    if (!gatewayId)
      throw createError(400, "Указанный платежный шлюз не найден");

    let subscriptionId =
      await subscriptionRepository.findActiveSubscriptionByChannel(
        userTgId,
        service.channel_id,
      );

    // let subscriptionId = await subscriptionRepository.findActiveSubscription(
    //   userTgId,
    //   service.id,
    // );

    if (!subscriptionId) {
      subscriptionId = await subscriptionRepository.createDraftSubscription(
        userTgId,
        service.id,
      );
    }

    const basePrice = parseFloat(service.price);
    const platformCommissionPercent = service.platform_commission
      ? parseFloat(service.platform_commission) / 100
      : 0.03;
    // ==========================================
    // СЦЕНАРИЙ 1: CRYPTO BOT
    // ==========================================
    if (gatewayCode === "crypto_bot") {
      const cryptoBotFeePercent = 0.03;
      const invoicePriceForClient = parseFloat(
        (basePrice / (1 - cryptoBotFeePercent)).toFixed(2),
      );
      const netAmount = parseFloat(
        (basePrice * (1 - platformCommissionPercent)).toFixed(2),
      );

      const invoice = await cryptoPay.createInvoice(
        "USDT",
        invoicePriceForClient,
        {
          description: `Подписка на доступ на ${service.duration_days} дней`,
          expires_in: 1800,
          payload: JSON.stringify({
            userId: userTgId,
            serviceId: service.id,
            subscriptionId: subscriptionId,
          }),
        },
      );

      await paymentRepository.createPaymentRecord({
        serviceId: service.id,
        subscriptionId: subscriptionId,
        userTgId,
        channelId: service.channel_id,
        amount: invoicePriceForClient,
        netAmount: netAmount,
        currencyId: service.currency_id,
        gatewayId,
        gatewayInvoiceId: invoice.invoice_id.toString(),
      });

      return { payUrl: invoice.pay_url };
    }

    // ==========================================
    // СЦЕНАРИЙ 2: TELEGRAM STARS
    // ==========================================
    if (gatewayCode === "tg_stars") {
      const feePercent = 0.05;
      const invoicePriceForClient = parseFloat(
        (basePrice / (1 - feePercent)).toFixed(4),
      );

      const starRate = 0.013;
      const invoicePriceInStars = Math.ceil(invoicePriceForClient / starRate);
      if (isNaN(invoicePriceInStars) || invoicePriceInStars <= 0) {
        throw createError(400, "Некорректная цена тарифа для Telegram Stars");
      }

      const netAmountUSD = parseFloat(
        (basePrice * (1 - platformCommissionPercent)).toFixed(4),
      );

      const gatewayInvoiceId = `stars_inv_${subscriptionId}_${Date.now()}`;

      const payloadString = JSON.stringify({
        userId: userTgId,
        serviceId: service.id,
        subscriptionId: subscriptionId,
        gatewayInvoiceId: gatewayInvoiceId,
      });

      const invoiceLink = await bot.telegram.createInvoiceLink({
        title: `Подписка: ${service.title}. Доступ на ${service.duration_days} дней.`,
        description: `Оплата подписки на ресурс через мерчант.`,
        payload: payloadString,
        currency: "XTR",
        prices: [{ label: "Оплата звездами", amount: invoicePriceInStars }],
      });

      await paymentRepository.createPaymentRecord({
        serviceId: service.id,
        subscriptionId: subscriptionId,
        userTgId,
        channelId: service.channel_id,
        amount: basePrice,
        netAmount: netAmountUSD,
        currencyId: service.currency_id,
        gatewayId,
        gatewayInvoiceId: gatewayInvoiceId,
      });

      return { payUrl: invoiceLink };
    }

    throw createError(400, "Данный платежный шлюз пока не поддерживается");
  }

  async handleSuccessfulInvoice(gatewayInvoiceId) {
    const payment =
      await paymentRepository.findPaymentDetailsByInvoiceId(gatewayInvoiceId);
    console.log(payment);
    if (!payment) {
      console.warn(
        `⚠️ [WEBHOOK] Оплаченный инвойс не найден в БД: ${gatewayInvoiceId}`,
      );
      return false;
    }

    if (payment.payment_status === "success") {
      console.log(`ℹ️ [WEBHOOK] Инвойс ${gatewayInvoiceId} уже был обработан.`);
      return true;
    }

    const user = await userRepository.findById(payment.admin_id);
    if (!user) {
      console.warn(
        `⚠️ [WEBHOOK] Администратор ${payment.admin_id} не найден для платежа ${gatewayInvoiceId}`,
      );
      return false;
    }

    let isUserAlreadyInChannel = false;
    try {
      const member = await bot.telegram.getChatMember(
        payment.tg_channel_id,
        payment.user_tg_id,
      );
      if (["member", "administrator", "creator"].includes(member.status)) {
        isUserAlreadyInChannel = true;
      }
    } catch (err) {
      isUserAlreadyInChannel = false;
    }

    const { totalPaidMoney, adminShare, platformProfit } =
      calculateInvoiceSplit(payment.real_paid_amount, user.platform_commission);

    const { newExpiresAt, nextStatus, isRenewal } =
      calculateSubscriptionExtension(
        payment.sub_status,
        payment.sub_current_expires,
        payment.real_duration_days,
      );

    const finalStatus = isUserAlreadyInChannel ? "active" : nextStatus;

    const isSubscription = payment.service_type === "subscription" ? 1 : 0;
    let inviteLinkObj = null;

    if (!isRenewal) {
      inviteLinkObj = await bot.telegram.createChatInviteLink(
        payment.tg_channel_id,
        { member_limit: 1 },
      );
    }

    await runTransaction(async (txClient) => {
      await paymentRepository.confirmPayment(payment.payment_id, txClient);
      await userRepository.updateBalanceByUserId(
        payment.admin_id,
        payment.net_amount,
        txClient,
      );

      const isRealNewCustomer = await customerRepository.isFirstTimeCustomer(
        payment.channel_id,
        payment.user_tg_id,
        txClient,
      );

      await customerRepository.insert(
        payment.channel_id,
        payment.user_tg_id,
        payment.net_amount,
        txClient,
      );

      let statsType = "renewal";

      if (!isRenewal && isRealNewCustomer) {
        statsType = "new";
      } else if (!isRenewal && !isRealNewCustomer) {
        statsType = "renewal";
      } else {
        statsType = "renewal";
      }

      await channelRepository.upsertStats(
        payment.channel_id,
        {
          amount: payment.net_amount,
          type: statsType,
        },
        txClient,
      );
      await platformFinances.updatePlatformBalance(
        totalPaidMoney,
        platformProfit,
        txClient,
      );

      await subscriptionRepository.updateSubscriptionDetails(
        payment.subscription_id,
        finalStatus,
        newExpiresAt,
        payment.real_service_id,
        txClient,
      );

      if (inviteLinkObj) {
        await paymentRepository.updateSubscriptionInviteLink(
          payment.subscription_id,
          inviteLinkObj.invite_link,
          txClient,
        );
      }
    });

    console.log(`📊 [TRANSACTION SUCCESS] Баланс начислен, платеж закрыт.`);

    const adminBot = botManager.getBot(payment.channel_id);

    if (!adminBot) {
      console.error(
        `🚨 Критическая ошибка: Бот для канала ${payment.channel_id} не найден в памяти менеджера ботов! Оповещение не отправлено.`,
      );
    } else {
      if (isRenewal) {
        await adminBot.telegram.sendMessage(
          payment.user_tg_id,
          `🔄 <b>Подписка успешно продлена!</b>\n\nВаш доступ к закрытому каналу <b>${payment.channel_title}</b> успешно продлен на <b>${payment.real_duration_days} дней</b>.\n\nНовая дата окончания: <code>${newExpiresAt.toLocaleDateString("ru-RU")}</code>.`,
          { parse_mode: "HTML" },
        );
      } else if (inviteLinkObj) {
        await adminBot.telegram.sendMessage(
          payment.user_tg_id,
          `🎉 <b>Спасибо за оплату!</b>\n\nВаша ссылка для входа:\n👉 ${inviteLinkObj.invite_link}`,
          { parse_mode: "HTML" },
        );
      }
    }

    return true;
  }

  async handleSuccessfulStarsPayment(invoicePayload, chargeId) {
    let payloadObj;
    try {
      payloadObj =
        typeof invoicePayload === "string"
          ? JSON.parse(invoicePayload)
          : invoicePayload;
    } catch (e) {
      console.error("❌ Ошибка парсинга invoicePayload:", e.message);
      return false;
    }

    console.log("Ищем инвойс звёзд в базе:", payloadObj.gatewayInvoiceId);

    const payment = await paymentRepository.findPaymentDetailsByInvoiceId(
      payloadObj.gatewayInvoiceId,
    );

    if (!payment) {
      console.warn(
        `⚠️ [STARS] Оплаченный инвойс не найден в БД: ${invoicePayload}`,
      );
      return false;
    }

    if (payment.payment_status === "success") {
      console.log(
        `ℹ️ [STARS] Инвойс Звёзд ${invoicePayload} уже был обработан.`,
      );
      return true;
    }

    const user = await userRepository.findById(payment.admin_id);
    if (!user) {
      console.warn(
        `⚠️ [STARS] Администратор ${payment.admin_id} не найден для платежа ${invoicePayload}`,
      );
      return false;
    }

    const basePriceUSD = parseFloat(payment.real_paid_amount);

    const { totalPaidMoney, adminShare, platformProfit } =
      calculateInvoiceSplit(basePriceUSD, user.platform_commission);

    let isUserAlreadyInChannel = false;
    try {
      const member = await bot.telegram.getChatMember(
        payment.tg_channel_id,
        payment.user_tg_id,
      );
      if (["member", "administrator", "creator"].includes(member.status)) {
        isUserAlreadyInChannel = true;
      }
    } catch (err) {
      isUserAlreadyInChannel = false;
    }
    const { newExpiresAt, nextStatus, isRenewal } =
      calculateSubscriptionExtension(
        payment.sub_status,
        payment.sub_current_expires,
        payment.real_duration_days,
      );

    const finalStatus = isUserAlreadyInChannel ? "active" : nextStatus;

    const availableAt = new Date();
    availableAt.setDate(availableAt.getDate() + 21);

    let inviteLinkObj = null;

    if (!isRenewal) {
      inviteLinkObj = await bot.telegram.createChatInviteLink(
        payment.tg_channel_id,
        {
          member_limit: 1,
          expire_date: Math.floor(Date.now() / 1000) + 86400,
        },
      );
    }

    await runTransaction(async (txClient) => {
      await paymentRepository.confirmStarsPayment(
        payment.payment_id,
        chargeId,
        availableAt,
        txClient,
      );

      await userRepository.updateHoldBalanceByUserId(
        payment.admin_id,
        payment.net_amount,
        txClient,
      );

      const isRealNewCustomer = await customerRepository.isFirstTimeCustomer(
        payment.channel_id,
        payment.user_tg_id,
        txClient,
      );

      await customerRepository.insert(
        payment.channel_id,
        payment.user_tg_id,
        payment.net_amount,
        txClient,
      );

      let statsType = "renewal";

      if (!isRenewal && isRealNewCustomer) {
        statsType = "new";
      } else if (!isRenewal && !isRealNewCustomer) {
        statsType = "renewal";
      } else {
        statsType = "renewal";
      }

      await channelRepository.upsertStats(
        payment.channel_id,
        {
          amount: payment.net_amount,
          type: statsType,
        },
        txClient,
      );

      await platformFinances.updatePlatformBalance(totalPaidMoney, 0, txClient);

      await subscriptionRepository.updateSubscriptionDetails(
        payment.subscription_id,
        finalStatus,
        newExpiresAt,
        payment.real_service_id,
        txClient,
      );

      if (inviteLinkObj) {
        await paymentRepository.updateSubscriptionInviteLink(
          payment.subscription_id,
          inviteLinkObj.invite_link,
          txClient,
        );
      }
    });

    console.log(
      `⭐️ [STARS TRANSACTION SUCCESS] Баланс начислен (с холдом 21 день), платеж закрыт.`,
    );

    const adminBot = botManager.getBot(payment.channel_id);
    if (!adminBot) {
      console.error(
        `🚨 Критическая ошибка: Бот для канала ${payment.channel_id} не найден в памяти менеджера ботов! Оповещение не отправлено.`,
      );
    } else {
      if (isRenewal) {
        await adminBot.telegram.sendMessage(
          payment.user_tg_id,
          `🔄 <b>Подписка успешно продлена через Telegram Stars!</b>\n\nВаш доступ к закрытому ресурсу <b>${payment.channel_title}</b> продлен на <b>${payment.real_duration_days} дней</b>.\n\nНовая дата окончания: <code>${newExpiresAt.toLocaleDateString("ru-RU")}</code>.`,
          { parse_mode: "HTML" },
        );
      } else if (inviteLinkObj) {
        await adminBot.telegram.sendMessage(
          payment.user_tg_id,
          `🎉 <b>Спасибо за оплату Звёздами!</b>\n\nВаша персональная ссылка для входа на ресурс <b>${payment.channel_title}</b>:\n👉 ${inviteLinkObj.invite_link}\n\n<i>Ссылка одноразовая и действует 24 часа.</i>`,
          { parse_mode: "HTML" },
        );
      }
    }

    return true;
  }

  async handleStarsRefund(chargeId) {
    const payment =
      await paymentRepository.findPaymentByTelegramChargeId(chargeId);

    if (!payment) {
      console.error(
        `❌ [REFUND ERROR] Платеж с Charge ID ${chargeId} не найден в базе данных!`,
      );
      return false;
    }

    if (payment.payment_status === "refunded") {
      console.log(
        `ℹ️ [REFUND] Этот возврат уже был обработан для платежа #${payment.payment_id}`,
      );
      return true;
    }

    const adminBot = botManager.getBot(payment.channel_id);
    try {
      await adminBot.telegram.banChatMember(
        payment.tg_channel_id,
        payment.user_tg_id,
      );
      await adminBot.telegram.unbanChatMember(
        payment.tg_channel_id,
        payment.user_tg_id,
      );
      console.log(
        `🥾 [REFUND] Юзер ${payment.user_tg_id} успешно выкинут из ресурса ${payment.channel_id}`,
      );
    } catch (botErr) {
      console.error(
        `⚠️ Не удалось выкинуть юзера через Bot API:`,
        botErr.message,
      );
    }

    const adminShareToSubtract = parseFloat(payment.net_amount);
    const totalPaidToSubtract = parseFloat(payment.amount);
    const platformProfitToSubtract = parseFloat(
      totalPaidMoney - adminShareToSubtract,
    );

    await runTransaction(async (txClient) => {
      await paymentRepository.updatePaymentStatus(
        payment.payment_id,
        "refunded",
        txClient,
      );

      await subscriptionRepository.updateSubscriptionStatus(
        payment.subscription_id,
        "canceled",
        txClient,
      );

      await userRepository.deductBalanceByUserId(
        payment.admin_id,
        adminShareToSubtract,
        txClient,
      );

      await platformFinances.reversePlatformBalance(
        totalPaidToSubtract,
        platformProfitToSubtract,
        txClient,
      );

      await customerRepository.deleteCustomer(
        payment.channel_id,
        payment.user_tg_id,
        txClient,
      );
    });

    console.log(
      `📉 [REFUND SUCCESS] Все балансы успешно скорректированы в минус. Подписка #${payment.subscription_id} закрыта.`,
    );

    try {
      await bot.telegram.sendMessage(
        payment.admin_tg_id,
        `🚨 <b>Внимание! Оформлен возврат звёзд!</b>\n\nПользователь оспорил платеж за подписку <b>${payment.channel_title}</b>.\n\n` +
          `🛑 Юзер автоматически удален из канала.\n` +
          `💸 С вашего баланса удержано: <code>-$${adminShareToSubtract}</code> (эквивалент в USD).`,
        { parse_mode: "HTML" },
      );
    } catch (msgErr) {
      console.error(
        "Не удалось отправить уведомление админу о рефанде:",
        msgErr.message,
      );
    }

    return true;
  }
}

export const paymentService = new PaymentService();
