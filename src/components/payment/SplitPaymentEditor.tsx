import { memo, useMemo } from 'react';

import type { SplitPaymentPart } from '../../types/pos';
import { formatCurrency } from '../../utils/currency';

interface SplitPaymentEditorProps {
  totalAmount: number;
  parts: SplitPaymentPart[];
  processingPartId: string | null;
  onSplitCountChange: (count: 2 | 3) => void;
  onAmountChange: (partId: string, amount: number) => void;
  onMethodChange: (partId: string, method: 'NAKIT' | 'KART') => void;
  onSendCardPart: (partId: string) => void;
  onMarkCashPart: (partId: string) => void;
}

export const SplitPaymentEditor = memo(({
  totalAmount,
  parts,
  processingPartId,
  onSplitCountChange,
  onAmountChange,
  onMethodChange,
  onSendCardPart,
  onMarkCashPart,
}: SplitPaymentEditorProps) => {
  const splitSummary = useMemo(() => {
    const plannedTotal = parts.reduce((sum, part) => sum + part.amount, 0);
    const paidTotal = parts.filter((part) => part.paid).reduce((sum, part) => sum + part.amount, 0);
    const remainingAmount = Math.max(0, totalAmount - paidTotal);
    const planDifference = Number((totalAmount - plannedTotal).toFixed(2));

    return {
      plannedTotal,
      paidTotal,
      remainingAmount,
      planDifference,
    };
  }, [parts, totalAmount]);

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">Bölünmüş Ödeme</h3>

        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
          {[2, 3].map((count) => (
            <button
              key={count}
              type="button"
              onClick={() => onSplitCountChange(count as 2 | 3)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                parts.length === count ? 'bg-[#E9C44A] text-[#1F2229]' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {count} Parça
            </button>
          ))}
        </div>
      </div>

      {parts.map((part, index) => (
        <div key={part.id} className="space-y-2 rounded-lg border border-slate-200 bg-white p-2.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Parça {index + 1}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                part.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {part.paid ? 'Tamamlandı' : 'Bekliyor'}
            </span>
          </div>

          <div className="grid gap-2 sm:grid-cols-[120px_1fr_auto]">
            <input
              type="number"
              min={0}
              step={0.01}
              value={part.amount}
              onChange={(event) => onAmountChange(part.id, Number(event.target.value))}
              disabled={part.paid}
              className="rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-700 focus:border-[#E9C44A] focus:outline-none"
            />

            <select
              value={part.method}
              onChange={(event) => onMethodChange(part.id, event.target.value as 'NAKIT' | 'KART')}
              disabled={part.paid}
              className="rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-700 focus:border-[#E9C44A] focus:outline-none"
            >
              <option value="NAKIT">Nakit</option>
              <option value="KART">Kart</option>
            </select>

            {part.paid ? (
              <span className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700">
                Ödendi
              </span>
            ) : (
              <button
                type="button"
                onClick={() => (part.method === 'KART' ? onSendCardPart(part.id) : onMarkCashPart(part.id))}
                disabled={processingPartId === part.id || part.amount <= 0}
                className="rounded-lg bg-[#E9C44A] px-3 py-2 text-xs font-semibold text-[#1F2229] transition hover:bg-[#ddb73f] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
              >
                {processingPartId === part.id ? 'İşleniyor' : part.method === 'KART' ? 'POS’a Gönder' : 'Tahsil Edildi'}
              </button>
            )}
          </div>
        </div>
      ))}

      <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
        <p className="rounded-lg border border-slate-200 bg-white px-2 py-1.5">Planlanan: <strong>{formatCurrency(splitSummary.plannedTotal)}</strong></p>
        <p className="rounded-lg border border-slate-200 bg-white px-2 py-1.5">Ödenen: <strong>{formatCurrency(splitSummary.paidTotal)}</strong></p>
        <p className="rounded-lg border border-slate-200 bg-white px-2 py-1.5">Kalan: <strong>{formatCurrency(splitSummary.remainingAmount)}</strong></p>
      </div>

      {splitSummary.planDifference !== 0 ? (
        <p className="text-xs font-medium text-rose-600">
          Parça toplamı genel toplamla eşleşmiyor ({formatCurrency(splitSummary.planDifference)} fark).
        </p>
      ) : null}
    </div>
  );
});

SplitPaymentEditor.displayName = 'SplitPaymentEditor';
