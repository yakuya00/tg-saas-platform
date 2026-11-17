export const messages = {
  welcome: (firstName) =>
    `Привет, ${firstName}! 👋\n\nЧтобы подключить свой канал к SaaS, просто перешли мне любой пост из него.`,
  starsRenewalSuccess: (channelTitle, durationDays, formattedDate) =>
    `🔄 <b>Подписка успешно продлена за Звёзды!</b>\n\n` +
    `Доступ к приватному каналу <b>${channelTitle}</b> успешно продлен на <b>${durationDays} дней</b>.\n\n` +
    `Новая дата окончания доступа: <code>${formattedDate}</code>.\n\n` +
    `Спасибо, что продлеваете подписку вовремя!`,

  starsNewSuccess: (inviteLink) =>
    `🎉 <b>Оплата в Звёздах получена!</b>\n\n` +
    `Ваша персональная одноразовая ссылка для входа в приватный канал:\n👉 ${inviteLink}\n\n` +
    `⚠️ <b>Внимание:</b> ссылка одноразовая. Кто первый по ней перейдет, за тем подписка окончательно и закрепится в базе!`,

  starsError:
    "❌ Ошибка при выдаче или продлении ссылки. Напишите администратору платформы.",

  forwardInstructions:
    "👉 Чтобы подключить канал, просто перешли мне любой пост из него!",

  botNotAdmin: (channelTitle) =>
    `❌ Ошибка! Я вижу канал "${channelTitle}", но вы забыли добавить меня туда в качестве Администратора с правом приглашения пользователей.`,

  userNotAdmin: (channelTitle) =>
    `❌ Эй, ты не являешься администратором канала "${channelTitle}"!`,

  channelConnectedSuccess: (channelTitle) =>
    `✅ Канал "${channelTitle}" успешно подключен к платформе!\n\nТеперь открой Web App, чтобы настроить тарифы для подписчиков.`,

  channelConnectError:
    "❌ Произошла ошибка при подключении канала. Убедитесь, что бот добавлен в канал.",

  subscriptionExpiredNotify: (channelTitle) =>
    `⚠️ <b>Срок действия вашей подписки истёк.</b>\n\nВы были удалены из канала <b>${channelTitle}</b>. Чтобы вернуться, оформите подписку заново в нашем Mini App!`,

  subscriptionExpirationReminder: (channelTitle, formattedDate) =>
    `⏳ <b>Внимание! Подписка заканчивается</b>\n\n` +
    `Доступ к каналу <b>${channelTitle}</b> закроется через 3 дня (<b>${formattedDate}</b>).\n\n` +
    `Продлите подписку заранее, чтобы не потерять инвайт-ссылку и доступ к контенту!`,

  renewSubscriptionButton: "🔄 Продлить подписку",
};
