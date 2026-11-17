import { CryptoPay } from "@foile/crypto-pay-api";

const isTestnet = process.env.IS_TEST_CRYPTO_BOT === "true";

export const cryptoPay = new CryptoPay(process.env.CRYPTO_BOT_TOKEN, {
  protocol: "https",
  hostname: isTestnet ? "testnet-pay.crypt.bot" : "pay.crypt.bot",
});
