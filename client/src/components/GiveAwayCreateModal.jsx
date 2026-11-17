import { useGiveawayCreateModal } from "../hooks/useGiveawayCreateModal";

export default function GiveAwayCreateModal({
  channelId,
  close,
  loadData,
  setIsGiveAwayModalOpen,
  formattedServices,
}) {
  const {
    giveawayTitle,
    setGiveawayTitle,
    giveawayWinners,
    setGiveawayWinners,
    giveawayServiceId,
    setGiveawayServiceId,
    giveawayDurationDays,
    setGiveawayDurationDays,
    handleCreateGiveaway,
  } = useGiveawayCreateModal(
    channelId,
    loadData,
    setIsGiveAwayModalOpen,
    formattedServices,
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={close} />
      <div className="bg-tg-bg w-full rounded-t-3xl border-t border-tg-hint/10 p-5 pb-8 relative animate-in slide-in-from-bottom-25 duration-300">
        <div className="w-10 h-1.5 bg-tg-hint/20 rounded-full mx-auto mb-4 -mt-1" />

        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-bold text-[16px] text-tg-text">
            Запуск розыгрыша
          </h3>
          <button onClick={close} className="text-sm font-bold text-tg-link">
            Отмена
          </button>
        </div>

        <form onSubmit={handleCreateGiveaway} className="space-y-3.5">
          {/* Название розыгрыша */}
          <div>
            <label className="block text-[11px] font-bold text-tg-hint uppercase tracking-wider mb-1 pl-1">
              Название розыгрыша
            </label>
            <input
              type="text"
              required
              placeholder="Например: Дарим VIP доступ за подписку!"
              value={giveawayTitle}
              onChange={(e) => setGiveawayTitle(e.target.value)}
              className="w-full bg-tg-secondary-bg border border-tg-hint/10 rounded-xl px-3.5 py-3 text-[13px] text-tg-text focus:outline-none focus:border-tg-link shadow-inner"
            />
          </div>

          {/* Сетка: Что дарим и Кол-во мест */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-tg-hint uppercase tracking-wider mb-1 pl-1">
                Какой продукт дарим?
              </label>
              <select
                required
                value={giveawayServiceId}
                onChange={(e) => setGiveawayServiceId(e.target.value)}
                className="w-full bg-tg-secondary-bg border border-tg-hint/10 rounded-xl px-3 py-3 text-[13px] text-tg-text font-bold focus:outline-none"
              >
                <option value="">Выберите товар...</option>
                {formattedServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} (${s.price})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-tg-hint uppercase tracking-wider mb-1 pl-1">
                Кол-во победителей
              </label>
              <select
                value={giveawayWinners}
                onChange={(e) => setGiveawayWinners(e.target.value)}
                className="w-full bg-tg-secondary-bg border border-tg-hint/10 rounded-xl px-3 py-3 text-[13px] text-tg-text font-bold focus:outline-none"
              >
                <option value="1">1 место</option>
                <option value="3">3 места</option>
                <option value="5">5 мест</option>
                <option value="10">10 мест</option>
              </select>
            </div>
          </div>

          {/* Длительность розыгрыша */}
          <div>
            <label className="block text-[11px] font-bold text-tg-hint uppercase tracking-wider mb-1 pl-1">
              Длительность розыгрыша
            </label>
            <select
              value={giveawayDurationDays}
              onChange={(e) => setGiveawayDurationDays(Number(e.target.value))}
              className="w-full bg-tg-secondary-bg border border-tg-hint/10 rounded-xl px-3.5 py-3 text-[13px] text-tg-text font-bold focus:outline-none"
            >
              <option value="1">1 день (24 часа)</option>
              <option value="2">2 дня</option>
              <option value="3">3 дня</option>
              <option value="5">5 дней</option>
              <option value="7">1 неделя</option>
              <option value="14">2 недели</option>
            </select>
          </div>

          {/* Кнопка отправки формы */}
          <button
            type="submit"
            disabled={!giveawayServiceId}
            className="w-full bg-tg-button text-tg-button-text py-3.5 rounded-xl text-[14px] font-bold shadow-md mt-2 disabled:opacity-40 active:opacity-90 transition-opacity"
          >
            Запустить гивевей
          </button>
        </form>
      </div>
    </div>
  );
}
