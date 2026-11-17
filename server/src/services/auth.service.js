import createError from "http-errors";
import { userRepository } from "../repositories/user.repository.js";

class AuthService {
  async authUser(tgUser, startParam) {
    if (!tgUser) {
      throw createError(400, "Не передан ID пользователя Telegram.");
    }

    const existingUser = await userRepository.findById(tgUser.id);
    let referrerId = null;

    if (!existingUser && startParam) {
      const refId = parseInt(startParam, 10);
      if (!isNaN(refId)) {
        const referrer = await userRepository.findById(refId);
        if (referrer) {
          referrerId = refId;
        }
      }
    }
    const user = await userRepository.upsertUser({
      tg_id: tgUser.id,
      username: tgUser.username,
      first_name: tgUser.first_name,
      language_code: tgUser.language_code || "ru",
      referrer_id: referrerId,
    });

    return user;
  }
}

export const authService = new AuthService();
