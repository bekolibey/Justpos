import type { PaymentStatus, TableStatus } from '../../types/pos';
import { PAYMENT_STATUS_LABELS, TABLE_STATUS_LABELS } from '../../utils/labels';

interface StatusBadgeProps {
  variant: 'table' | 'payment';
  value: TableStatus | PaymentStatus;
}

const tableStyles: Record<TableStatus, string> = {
  BOS: 'border border-slate-200 bg-slate-100 text-slate-600',
  DOLU: 'border border-[#F2D15C] bg-[#FFF8DD] text-[#7A5B00]',
  ODEME_BEKLIYOR: 'border border-[#E7B341] bg-[#FFF2CF] text-[#815800]',
  ODENDI: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
};

const paymentStyles: Record<PaymentStatus, string> = {
  BEKLIYOR: 'border border-slate-200 bg-slate-100 text-slate-700',
  BASARILI: 'border border-emerald-200 bg-emerald-50 text-emerald-700',
  BASARISIZ: 'border border-rose-200 bg-rose-50 text-rose-700',
};

export const StatusBadge = ({ variant, value }: StatusBadgeProps) => {
  if (variant === 'payment') {
    const paymentValue = value as PaymentStatus;

    return (
      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${paymentStyles[paymentValue]}`}>
        {PAYMENT_STATUS_LABELS[paymentValue]}
      </span>
    );
  }

  const tableValue = value as TableStatus;

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tableStyles[tableValue]}`}>
      {TABLE_STATUS_LABELS[tableValue]}
    </span>
  );
};
