import { memo } from 'react';
import { Clock3, Users } from 'lucide-react';

import type { Table } from '../../types/pos';
import { formatCurrency } from '../../utils/currency';
import { formatElapsed } from '../../utils/date';
import { calculateTotals } from '../../utils/order';
import { AppButton } from '../ui/AppButton';
import { ServiceStatusBadge } from '../ui/ServiceStatusBadge';
import { StatusBadge } from '../ui/StatusBadge';
import type { ServiceStatus } from '../../types/pos';

interface TableCardCompactProps {
  table: Table;
  serviceStatus: ServiceStatus;
  totalAmount?: number;
  onOrder: (tableId: string) => void;
  onPayment: (tableId: string) => void;
}

export const TableCardCompact = memo(({ table, serviceStatus, totalAmount, onOrder, onPayment }: TableCardCompactProps) => {
  const grandTotal =
    totalAmount ??
    calculateTotals(table.orderItems, {
      guestCount: table.guestCount,
      coverEnabled: table.coverEnabled,
      coverPerGuest: table.coverPerGuest,
    }).grandTotal;
  const hasOrder = table.orderItems.length > 0;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300">
      <button
        type="button"
        onClick={() => onOrder(table.id)}
        className="w-full text-left"
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Masa</p>
            <p className="text-3xl font-bold leading-none text-slate-900">{table.number.toString().padStart(2, '0')}</p>
          </div>
          <StatusBadge variant="table" value={table.status} />
        </div>

        <div className="mb-2 grid grid-cols-2 gap-2 text-xs text-slate-600">
          <span className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2"><Users size={14} /> {table.guestCount > 0 ? `${table.guestCount} Kişi` : '-'}</span>
          <span className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2"><Clock3 size={14} /> {table.openedAt ? formatElapsed(table.openedAt) : '--:--'}</span>
        </div>

        <div className="rounded-lg bg-slate-50 px-2.5 py-2">
          {hasOrder ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Toplam</span>
                <strong className="text-base text-slate-900">{formatCurrency(grandTotal)}</strong>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-slate-500">Servis</span>
                <ServiceStatusBadge value={serviceStatus} />
              </div>
            </div>
          ) : (
            <span className="text-xs font-medium text-slate-500">Masa boş</span>
          )}
        </div>
      </button>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <AppButton variant={hasOrder ? 'secondary' : 'primary'} className="min-h-12" onClick={() => onOrder(table.id)}>
          {hasOrder ? 'Adisyona Git' : 'Sipariş Başlat'}
        </AppButton>
        <AppButton variant="primary" className="min-h-12" onClick={() => onPayment(table.id)} disabled={!hasOrder}>
          {table.status === 'ODEME_BEKLIYOR' ? 'Tahsilat Al' : 'Ödeme'}
        </AppButton>
      </div>
    </article>
  );
});

TableCardCompact.displayName = 'TableCardCompact';
