export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Внутренняя ошибка сервера";

  if (status === 500) {
    console.error("💥 SYSTEM CRITICAL ERROR:", err.stack);
  } else {
    console.warn(`⚠️ [${status}] Client Error: ${message}`);
  }

  return res.status(status).json({
    success: false,
    error: message,
  });
};
