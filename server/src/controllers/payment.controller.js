import asyncHandler from "express-async-handler";
import createError from "http-errors";
import { paymentService } from "../services/payment.service.js";
import { paymentRepository } from "../repositories/payment.repository.js";

export const createInvoice = asyncHandler(async (req, res) => {
  const { userTgId, tariffId, gatewayCode } = req.body;

  const result = await paymentService.processInvoiceGeneration(
    userTgId,
    tariffId,
    gatewayCode,
  );

  return res.json({
    success: true,
    payUrl: result.payUrl,
  });
});

export const cryptoBotWebhook = asyncHandler(async (req, res) => {
  const { update_type, payload } = req.body;

  res.status(200).send("OK");

  if (update_type === "invoice_paid") {
    const gatewayInvoiceId = payload.invoice_id.toString();

    paymentService.handleSuccessfulInvoice(gatewayInvoiceId);
  }
});

export const getCurrencies = asyncHandler(async (req, res) => {
  const currencies = await paymentRepository.findAllCurrencies();

  if (!currencies || currencies.length === 0) {
    throw createError(404, "Справочник валют пуст или не найден");
  }

  return res.json({
    success: true,
    currencies,
  });
});
