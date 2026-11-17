import { usePromoCreateModal } from "../hooks/usePromoCreateModal.js";

export default function PromoCreateModal({
  channelId,
  close,
  loadData,
  setIsPromoModalOpen,
}) {
  const {
    promoCode,
    setPromoCode,
    discountType,
    setDiscountType,
    discountValue,
    setDiscountValue,
    usageLimit,
    setUsageLimit,
    expiresAt,
    setExpiresAt,
    handleCreatePromo,
  } = usePromoCreateModal(channelId, loadData, setIsPromoModalOpen);
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={close} />
      <div className="bg-tg-bg w-full rounded-t-3xl border-t border-tg-hint/10 p-5 pb-8 relative animate-in slide-in-from-bottom-25 duration-300">
        <div className="w-10 h-1.5 bg-tg-hint/20 rounded-full mx-auto mb-4 -mt-1" />

        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-bold text-[16px] text-tg-text">Новый промокод</h3>
          <button onClick={close} className="text-sm font-bold text-tg-link">
            Отмена
          </button>
        </div>

        <form onSubmit={handleCreatePromo} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-tg-hint uppercase tracking-wider mb-1 pl-1">
              Код купона (Капсом)
            </label>
            <input
              type="text"
              required
              placeholder="Например: TRAFFIC50"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="w-full bg-tg-secondary-bg border border-tg-hint/10 rounded-xl px-3.5 py-3 text-[13px] text-tg-text font-mono font-bold focus:outline-none focus:border-tg-link uppercase shadow-inner"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-tg-hint uppercase tracking-wider mb-1 pl-1">
                Тип скидки
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full bg-tg-secondary-bg border border-tg-hint/10 rounded-xl px-3 py-3 text-[13px] text-tg-text font-bold focus:outline-none"
              >
                <option value="percentage">Процент (%)</option>
                <option value="fixed">Фикс в баксах ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-tg-hint uppercase tracking-wider mb-1 pl-1">
                Размер скидки
              </label>
              <input
                type="number"
                required
                placeholder={discountType === "percentage" ? "50" : "10.00"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                className="w-full bg-tg-secondary-bg border border-tg-hint/10 rounded-xl px-3 py-3 text-[13px] text-tg-text font-mono font-bold focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-tg-hint uppercase tracking-wider mb-1 pl-1">
              Лимит использований (Опционально)
            </label>
            <input
              type="number"
              placeholder="Например: 100 (Пусто — безлимит)"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              className="w-full bg-tg-secondary-bg border border-tg-hint/10 rounded-xl px-3.5 py-3 text-[13px] text-tg-text focus:outline-none focus:border-tg-link shadow-inner"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-tg-hint uppercase tracking-wider mb-1 pl-1">
              Срок действия купона (Опционально)
            </label>
            <input
              type="date"
              value={expiresAt || ""}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full bg-tg-secondary-bg border border-tg-hint/10 rounded-xl px-3.5 py-3 text-[13px] text-tg-text focus:outline-none focus:border-tg-link shadow-inner font-sans"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-tg-button text-tg-button-text py-3.5 rounded-xl text-[14px] font-bold shadow-md mt-2"
          >
            Выпустить купон
          </button>
        </form>
      </div>
    </div>
  );
}
