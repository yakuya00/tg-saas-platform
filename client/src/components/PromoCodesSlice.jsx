import { PlusIcon, TicketIcon } from "@heroicons/react/24/outline";

export default function PromoCodesSlice({ promoCodes, open }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[11px] text-tg-hint font-bold uppercase tracking-wider">
          Купоны и скидки
        </h3>
        <button
          onClick={open}
          className="text-[12px] font-bold text-tg-link flex items-center gap-0.5 active:opacity-70 cursor-pointer"
        >
          <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" /> Добавить
        </button>
      </div>

      <div className="bg-tg-bg border border-tg-hint/10 rounded-xl overflow-hidden shadow-sm">
        {promoCodes.slice(0, 3).map((promo, index) => (
          <div
            key={promo.id}
            className={`flex items-center justify-between py-3.5 pr-3 ml-4 ${index !== Math.min(promoCodes.length, 3) - 1 ? "border-b border-tg-hint/10" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-purple-400 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                <TicketIcon className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h4 className="font-mono font-bold text-[14px] text-tg-text tracking-wide">
                  {promo.code}
                </h4>
                <div className="flex flex-wrap items-center gap-x-1.5 text-[10px] text-tg-hint mt-0.5 leading-none">
                  <div>
                    Использовано: <span>{promo.used_count}</span> из{" "}
                    <span>{promo.usage_limit ? promo.usage_limit : "∞"}</span>
                  </div>

                  {promo.expire_date && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-tg-hint/30 font-bold">•</span>
                      <span className="text-amber-500 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider">
                        до {promo.expire_date}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-tg-text">
                -{parseFloat(promo.discount_value).toFixed(0)}
                {promo.discount_type === "percentage" ? "%" : "$"}
              </span>
            </div>
          </div>
        ))}
        {promoCodes.length > 3 && (
          <button
            onClick={() => alert("Все купоны")}
            className="w-full bg-tg-bg text-center py-2.5 text-[11px] font-bold text-tg-link border-t border-tg-hint/5"
          >
            Показать все купоны ({promoCodes.length})
          </button>
        )}
      </div>
    </div>
  );
}
