import { memo, useMemo, type ReactNode } from 'react';

import type { PaymentType, Terminal } from '../../types/pos';
import { convertTryToEur, convertTryToUsd, formatCurrency, formatEur, formatUsd } from '../../utils/currency';
import { AppButton } from '../ui/AppButton';
import { AppSelect } from '../ui/FormField';

interface PaymentPanelProps {
  tableNo: number;
  adisyonNo: string;
  terminals: Terminal[];
  selectedTerminalId: string;
  onChangeTerminal: (terminalId: string) => void;
  waiters: readonly string[];
  selectedWaiterName: string;
  onChangeWaiter: (waiterName: string) => void;
  subtotal: number;
  serviceFee: number;
  coverCharge?: number;
  grandTotal: number;
  paymentType: PaymentType;
  onSelectPaymentType: (type: PaymentType) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  submitDisabled?: boolean;
  hideActions?: boolean;
  splitSection?: ReactNode;
}

const paymentOptions: Array<{ value: PaymentType; label: string }> = [
  { value: 'NAKIT', label: 'Nakit' },
  { value: 'KART', label: 'Kart' },
  { value: 'BOLUNMUS', label: 'Bölünmüş Ödeme' },
];

export const PaymentPanel = memo(({
  tableNo,
  adisyonNo,
  terminals,
  selectedTerminalId,
  onChangeTerminal,
  waiters,
  selectedWaiterName,
  onChangeWaiter,
  subtotal,
  serviceFee,
  coverCharge = 0,
  grandTotal,
  paymentType,
  onSelectPaymentType,
  onSubmit,
  onCancel,
  isSubmitting,
  submitDisabled,
  hideActions,
  splitSection,
}: PaymentPanelProps) => {
  const selectedTerminal = useMemo(
    () => terminals.find((terminal) => terminal.id === selectedTerminalId),
    [selectedTerminalId, terminals],
  );
  const totalInUsd = useMemo(() => formatUsd(convertTryToUsd(grandTotal)), [grandTotal]);
  const totalInEur = useMemo(() => formatEur(convertTryToEur(grandTotal)), [grandTotal]);

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3">
          <p className="text-xs text-slate-500">Masa No</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{tableNo}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3">
          <p className="text-xs text-slate-500">Adisyon No</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{adisyonNo}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_1fr]">
        <div className="space-y-2">
          <label htmlFor="terminal" className="text-sm font-medium text-slate-700">
            Terminal Seçimi
          </label>
          <AppSelect
            id="terminal"
            value={selectedTerminalId}
            onChange={(event) => onChangeTerminal(event.target.value)}
          >
            {terminals.map((terminal) => (
              <option key={terminal.id} value={terminal.id}>
                {terminal.name} ({terminal.terminalNo})
              </option>
            ))}
          </AppSelect>

          <label htmlFor="waiter" className="pt-1 text-sm font-medium text-slate-700">
            Ödemeyi Alan Garson
          </label>
          <AppSelect
            id="waiter"
            value={selectedWaiterName}
            onChange={(event) => onChangeWaiter(event.target.value)}
          >
            {waiters.length === 0 ? <option value="">Garson bulunamadı</option> : null}
            {waiters.map((waiterName) => (
              <option key={waiterName} value={waiterName}>
                {waiterName}
              </option>
            ))}
          </AppSelect>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
            <p className="font-semibold text-slate-900">POS Cihaz Bilgisi</p>
            <p className="mt-1 text-slate-600">{selectedTerminal?.model ?? '-'}</p>
            <p className="text-slate-600">Terminal No: {selectedTerminal?.terminalNo ?? '-'}</p>
            <p className="text-slate-600">Konum: {selectedTerminal?.location ?? '-'}</p>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <div className="flex items-center justify-between text-slate-600">
            <span>Ara Toplam</span>
            <strong className="text-slate-900">{formatCurrency(subtotal)}</strong>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>Hizmet Bedeli</span>
            <strong className="text-slate-900">{formatCurrency(serviceFee)}</strong>
          </div>
          {coverCharge > 0 ? (
            <div className="flex items-center justify-between text-slate-600">
              <span>Kuver</span>
              <strong className="text-slate-900">{formatCurrency(coverCharge)}</strong>
            </div>
          ) : null}
          <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
            <span>Tahsil Edilecek</span>
            <div className="text-right">
              <p>{formatCurrency(grandTotal)}</p>
              <p className="text-[11px] font-medium text-slate-500">
                Yaklaşık: {totalInUsd} • {totalInEur}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium text-slate-700">Ödeme Tipi</p>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {paymentOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectPaymentType(option.value)}
              className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                paymentType === option.value
                  ? 'border-[#E9C44A] bg-[#FFF7D5] text-[#7A5B00]'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {splitSection ? <div className="mt-5">{splitSection}</div> : null}

      {hideActions ? null : (
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <AppButton variant="ghost" onClick={onCancel}>
            Adisyona Geri Dön
          </AppButton>

          <AppButton onClick={onSubmit} disabled={isSubmitting || submitDisabled}>
            {isSubmitting ? 'İşlem Bekleniyor' : 'VakıfBank POS’a Gönder'}
          </AppButton>
        </div>
      )}
    </section>
  );
});

PaymentPanel.displayName = 'PaymentPanel';
