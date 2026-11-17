import { messages } from "../bot.messages.js";

export const startCommand = async (ctx) => {
  const firstName = ctx.from.first_name;
  await ctx.reply(messages.welcome(firstName));
};
