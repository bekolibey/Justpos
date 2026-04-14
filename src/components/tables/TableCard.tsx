import { memo } from 'react';
import { Clock3, Users } from 'lucide-react';

import type { Table } from '../../types/pos';
import { formatCurrency } from '../../utils/currency';
import { formatElapsed } from '../../utils/date';
import { calculateTotals } from '../../utils/order';
import { StatusBadge } from '../ui/StatusBadge';

interface TableCardProps {
  table: Table;
  totalAmount?: number;
  onSelect: (tableId: string) => void;
}

export const TableCard = memo(({ table, totalAmount, onSelect }: TableCardProps) => {
  const grandTotal =
    totalAmount ??
    calculateTotals(table.orderItems, {
      guestCount: table.guestCount,
      coverEnabled: table.coverEnabled,
      coverPerGuest: table.coverPerGuest,
    }).grandTotal;

  return (
    <button
      type="button"
      onClick={() => onSelect(table.id)}
      className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-slate-500">Masa</p>
          <p className="text-4xl font-bold leading-none text-slate-900">{table.number.toString().padStart(2, '0')}</p>
        </div>
        <StatusBadge variant="table" value={table.status} />
      </div>

      <div className="mb-4 flex items-center gap-4 text-sm text-slate-600">
        <div className="flex items-center gap-1.5">
          <Users size={16} />
          <span>{table.guestCount > 0 ? `${table.guestCount} Kişi` : '-'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock3 size={16} />
          <span>{table.openedAt ? formatElapsed(table.openedAt) : '--:--'}</span>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3">
        {table.orderItems.length > 0 ? (
          <>
            <p className="text-xs text-slate-500">Toplam Tutar</p>
            <p className="mt-1 text-xl font-bold text-slate-900">{formatCurrency(grandTotal)}</p>
          </>
        ) : (
          <p className="text-sm font-medium text-slate-500">Masa boş</p>
        )}
      </div>
    </button>
  );
});

TableCard.displayName = 'TableCard';
