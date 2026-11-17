import asyncHandler from "express-async-handler";
import createError from "http-errors";
import { userRepository } from "../repositories/user.repository.js";

export const getMe = async (req, res) => {
  const tgUser = req.tgUser;
  if (!tgUser || !tgUser.id) {
    throw createError(
      401,
      "Не удалось извлечь данные пользователя из Telegram",
    );
  }
  const dbUser = await userRepository.findById(tgUser.id);

  const dbUserData = dbUser || {};

  const fullUser = {
    ...dbUserData,
    ...tgUser,
  };

  return res.json({
    message: "Авторизация пройдена!",
    user: fullUser,
  });
};
