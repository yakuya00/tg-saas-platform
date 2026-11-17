export const calculateSubscriptionExtension = (
  subStatus,
  subCurrentExpires,
  durationDays,
) => {
  const isRenewal = subStatus === "active" || subStatus === "pending_join";

  let baseDate = new Date();

  if (isRenewal && subCurrentExpires) {
    const currentExpires = new Date(subCurrentExpires);
    baseDate = currentExpires > new Date() ? currentExpires : new Date();
  }

  const newExpiresAt = new Date(baseDate);
  newExpiresAt.setDate(newExpiresAt.getDate() + parseInt(durationDays || 0));

  const nextStatus = isRenewal ? subStatus : "pending_join";

  return {
    newExpiresAt,
    nextStatus,
    isRenewal,
  };
};
