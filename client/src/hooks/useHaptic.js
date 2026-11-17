import { useTelegram } from "../context/TelegramContext.jsx";

export function useHaptic() {
  const { tg } = useTelegram();

  const lightClick = () => {
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred("light");
    }
  };

  const mediumClick = () => {
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred("medium");
    }
  };

  const notificationSuccess = () => {
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred("success");
    }
  };

  const notificationError = () => {
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.notificationOccurred("error");
    }
  };

  return {
    lightClick,
    mediumClick,
    notificationSuccess,
    notificationError,
  };
}
