export const preCheckoutHandler = async (ctx) => {
  try {
    await ctx.answerPreCheckoutQuery(true);

    console.log(
      `🔹 [PRE-CHECKOUT] Платёж #${ctx.preCheckoutQuery.id} успешно подтверждён.`,
    );
  } catch (error) {
    console.error(
      "❌ [PRE-CHECKOUT ERROR] Ошибка при подтверждении платежа:",
      error.message,
    );
  }
};
