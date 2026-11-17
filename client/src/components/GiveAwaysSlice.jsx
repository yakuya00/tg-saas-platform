import { PlusIcon, GiftIcon } from "@heroicons/react/24/outline";

export default function GiveAwaysSlice({ giveaways, open }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[11px] text-tg-hint font-bold uppercase tracking-wider">
          Розыгрыши подписок
        </h3>
        <button
          onClick={open}
          className="text-[12px] font-bold text-tg-link flex items-center gap-0.5 active:opacity-70 cursor-pointer"
        >
          <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" /> Создать
        </button>
      </div>

      <div className="bg-tg-bg border border-tg-hint/10 rounded-xl overflow-hidden shadow-sm">
        {giveaways.slice(0, 3).map((giveaway, index) => (
          <div
            key={giveaway.id}
            className={`flex items-center justify-between py-3.5 pr-3 ml-4 ${index !== Math.min(giveaways.length, 3) - 1 ? "border-b border-tg-hint/10" : ""}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-b from-orange-400 to-red-500 text-white flex items-center justify-center shadow-sm">
                <GiftIcon className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h4 className="font-bold text-[13.5px] text-tg-text leading-tight">
                  {giveaway.title}
                </h4>
                <p className="text-[10px] text-tg-hint mt-0.5">
                  До: {giveaway.end_date} • Мест: {giveaway.winners_count}
                </p>
              </div>
            </div>
            <span
              className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${giveaway.status === "active" ? "bg-orange-500/10 text-orange-500" : "bg-tg-hint/10 text-tg-hint"}`}
            >
              {giveaway.status}
            </span>
          </div>
        ))}
        {giveaways.length > 3 && (
          <button
            onClick={() => alert("Все розыгрыши")}
            className="w-full bg-tg-bg text-center py-2.5 text-[11px] font-bold text-tg-link border-t border-tg-hint/5"
          >
            Показать все розыгрыши ({giveaways.length})
          </button>
        )}
      </div>
    </div>
  );
}
