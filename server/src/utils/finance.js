export const calculateInvoiceSplit = (realPaidAmount, feePercent) => {
  const totalPaidMoney = parseFloat(realPaidAmount || 0);
  const platformFeePercent = parseFloat(feePercent || 0) * 0.01;
  const adminShare = parseFloat(
    (totalPaidMoney * (1 - platformFeePercent)).toFixed(4),
  );
  const platformProfit = parseFloat((totalPaidMoney - adminShare).toFixed(4));

  return {
    totalPaidMoney,
    adminShare,
    platformProfit,
  };
};
