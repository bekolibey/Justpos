import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { MODIFIERS_BY_CATEGORY } from '../../data/modifiers';
import type { MenuItem, ModifierOption, PortionMultiplier } from '../../types/pos';
import { formatCurrency } from '../../utils/currency';
import { getPortionOptions } from '../../utils/portion';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../ui/FormField';

interface AddToOrderModalProps {
  item: MenuItem | null;
  guestCount: number;
  onClose: () => void;
  onConfirm: (payload: {
    portionMultiplier: PortionMultiplier;
    seatNo?: number;
    modifiers: ModifierOption[];
    note?: string;
  }) => void;
}

export const AddToOrderModal = ({ item, guestCount, onClose, onConfirm }: AddToOrderModalProps) => {
  const [portion, setPortion] = useState<PortionMultiplier>(1);
  const [seatNo, setSeatNo] = useState<number>(1);
  const [selectedModifierIds, setSelectedModifierIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const portionOptions = useMemo<PortionMultiplier[]>(
    () => (item ? getPortionOptions(item) : [1]),
    [item],
  );

  useEffect(() => {
    if (!item) {
      return;
    }

    setPortion(portionOptions[0] ?? 1);
    setSeatNo(Math.max(1, guestCount || 1));
    setSelectedModifierIds([]);
    setNote('');
  }, [item, guestCount, portionOptions]);

  useEffect(() => {
    if (!portionOptions.includes(portion)) {
      setPortion(portionOptions[0] ?? 1);
    }
  }, [portion, portionOptions]);

  const modifierGroups = useMemo(() => (item ? MODIFIERS_BY_CATEGORY[item.category] : []), [item]);
  const allOptions = useMemo(() => modifierGroups.flatMap((group) => group.options), [modifierGroups]);
  const selectedModifiers = useMemo(
    () => allOptions.filter((option) => selectedModifierIds.includes(option.id)),
    [allOptions, selectedModifierIds],
  );
  const modifiersTotal = selectedModifiers.reduce((sum, option) => sum + option.price, 0);

  if (!item) {
    return null;
  }

  const finalUnitPrice = Number((item.price * portion + modifiersTotal).toFixed(2));
  const portionGridClass =
    portionOptions.length <= 1 ? 'grid-cols-1' : portionOptions.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Ürün Özelleştir</h3>
            <p className="text-sm text-slate-500">{item.name}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
            aria-label="Kapat"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Porsiyon</p>
            <div className={`grid ${portionGridClass} gap-2`}>
              {portionOptions.map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setPortion(rate)}
                  className={`rounded-lg border px-2 py-2 text-sm font-semibold transition ${
                    portion === rate
                      ? 'border-[#D7AD2E] bg-[#FFF3CC] text-[#6E5408]'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {rate} Porsiyon
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Kişi (Seat)</label>
            <select
              value={seatNo}
              onChange={(event) => setSeatNo(Number(event.target.value))}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none transition focus:border-[#E9C44A]"
            >
              {Array.from({ length: Math.max(1, guestCount) }, (_, index) => (
                <option key={index + 1} value={index + 1}>
                  Kişi {index + 1}
                </option>
              ))}
            </select>
          </section>

          {modifierGroups.length > 0 ? (
            <section className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Modifier</p>
              {modifierGroups.map((group) => (
                <div key={group.id} className="rounded-lg border border-slate-200 bg-white p-2.5">
                  <p className="text-xs font-semibold text-slate-700">{group.name}</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {group.options.map((option) => {
                      const checked = selectedModifierIds.includes(option.id);

                      return (
                        <label key={option.id} className="inline-flex items-center gap-2 text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => {
                              setSelectedModifierIds((prev) => {
                                if (event.target.checked) {
                                  if (group.multi === false) {
                                    const groupOptionIds = group.options.map((entry) => entry.id);
                                    return [...prev.filter((id) => !groupOptionIds.includes(id)), option.id];
                                  }

                                  return [...prev, option.id];
                                }

                                return prev.filter((id) => id !== option.id);
                              });
                            }}
                            className="h-4 w-4 accent-[#D7AD2E]"
                          />
                          <span>{option.name}</span>
                          <strong>{option.price > 0 ? `+${formatCurrency(option.price)}` : ''}</strong>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </section>
          ) : null}

          <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Not</label>
            <AppInput
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Örn: Az pişmiş / Soğansız"
              className="mt-2"
            />
          </section>
        </div>

        <div className="mt-4 rounded-xl border border-[#E9C44A]/40 bg-[#FFF8DE] p-3 text-sm">
          <p className="flex items-center justify-between"><span>Birim Tutar</span><strong>{formatCurrency(finalUnitPrice)}</strong></p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <AppButton variant="ghost" onClick={onClose}>Vazgeç</AppButton>
          <AppButton
            onClick={() => {
              onConfirm({
                portionMultiplier: portion,
                seatNo: seatNo > 0 ? seatNo : undefined,
                modifiers: selectedModifiers,
                note: note.trim() ? note.trim() : undefined,
              });
              onClose();
            }}
          >
            Adisyona Ekle
          </AppButton>
        </div>
      </div>
    </div>
  );
};
