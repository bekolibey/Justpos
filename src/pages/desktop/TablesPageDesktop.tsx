import { CreditCard, LayoutGrid, Timer } from 'lucide-react';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { TableGrid } from '../../components/tables/TableGrid';
import { AppCard } from '../../components/ui/AppCard';
import { AppInput } from '../../components/ui/FormField';
import { PageHeader } from '../../components/ui/PageHeader';
import { appRoutes } from '../../constants/routes';
import { usePOS } from '../../state/POSContext';
import type { TableStatus } from '../../types/pos';
import { formatCurrency } from '../../utils/currency';
import { calculateTotals } from '../../utils/order';

export const TablesPageDesktop = () => {
  const navigate = useNavigate();
  const { tables } = usePOS();
  const [statusFilter, setStatusFilter] = useState<'TUMU' | TableStatus>('TUMU');
  const [searchTerm, setSearchTerm] = useState('');
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const totalsByTableId = useMemo(
    () =>
      tables.reduce<Record<string, number>>((acc, table) => {
        acc[table.id] = calculateTotals(table.orderItems, {
          guestCount: table.guestCount,
          coverEnabled: table.coverEnabled,
          coverPerGuest: table.coverPerGuest,
        }).grandTotal;
        return acc;
      }, {}),
    [tables],
  );

  const summary = useMemo(() => {
    const openAmount = Object.values(totalsByTableId).reduce((sum, total) => sum + total, 0);
    return {
      total: tables.length,
      active: tables.filter((table) => table.status === 'DOLU').length,
      waiting: tables.filter((table) => table.status === 'ODEME_BEKLIYOR').length,
      openAmount,
    };
  }, [tables, totalsByTableId]);

  const normalizedSearch = deferredSearchTerm.trim();

  const filteredTables = useMemo(
    () =>
      tables.filter((table) => {
        if (statusFilter !== 'TUMU' && table.status !== statusFilter) {
          return false;
        }

        if (normalizedSearch.length === 0) {
          return true;
        }

        return table.number.toString().includes(normalizedSearch);
      }),
    [normalizedSearch, statusFilter, tables],
  );

  const handleSelectTable = useCallback(
    (tableId: string) => {
      navigate(appRoutes.adisyon(tableId));
    },
    [navigate],
  );

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <AppCard>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Masalar</p>
            <LayoutGrid size={16} className="text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.total}</p>
        </AppCard>

        <AppCard>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Dolu Masa</p>
            <Timer size={16} className="text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.active}</p>
        </AppCard>

        <AppCard tone="highlight">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Ödeme Bekliyor</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{summary.waiting}</p>
        </AppCard>

        <AppCard>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Açık Tutar</p>
            <CreditCard size={16} className="text-slate-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(summary.openAmount)}</p>
        </AppCard>
      </section>

      <AppCard>
        <div className="mb-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 lg:grid-cols-[1fr_auto]">
          <AppInput
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Masa no ara..."
            className="bg-white"
          />

          <div className="flex flex-wrap gap-2">
            {[
              { value: 'TUMU', label: 'Tümü' },
              { value: 'BOS', label: 'Boş' },
              { value: 'DOLU', label: 'Dolu' },
              { value: 'ODEME_BEKLIYOR', label: 'Ödeme Bekliyor' },
              { value: 'ODENDI', label: 'Ödendi' },
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value as 'TUMU' | TableStatus)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  statusFilter === filter.value
                    ? 'border-[#D7AD2E] bg-[#FFF3CC] text-[#6E5408]'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <PageHeader title="Masalar" description="Masa kartına tıklayarak adisyon detayına geçin." />

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1"><LayoutGrid size={14} /> Canlı Durum</span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1"><Timer size={14} /> Süre Takibi</span>
            <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1"><CreditCard size={14} /> POS Akışı</span>
          </div>
        </div>

        <TableGrid
          tables={filteredTables}
          totalsByTableId={totalsByTableId}
          onSelectTable={handleSelectTable}
        />
      </AppCard>
    </div>
  );
};
