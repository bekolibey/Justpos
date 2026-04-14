import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { TableCardCompact } from '../../components/tables/TableCardCompact';
import { AppButton } from '../../components/ui/AppButton';
import { AppCard } from '../../components/ui/AppCard';
import { AppInput } from '../../components/ui/FormField';
import { appRoutes } from '../../constants/routes';
import { usePOS } from '../../state/POSContext';
import type { TableStatus } from '../../types/pos';
import { formatCurrency } from '../../utils/currency';
import { calculateTotals } from '../../utils/order';

export const TablesPageCompact = () => {
  const navigate = useNavigate();
  const { tables, tableServiceStatusById } = usePOS();
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

  const normalizedSearch = deferredSearchTerm.trim();

  const filteredTables = useMemo(() => {
    const statusPriority: Record<TableStatus, number> = {
      ODEME_BEKLIYOR: 0,
      DOLU: 1,
      BOS: 2,
      ODENDI: 3,
    };

    return tables
      .filter((table) => {
        if (statusFilter !== 'TUMU' && table.status !== statusFilter) {
          return false;
        }

        if (normalizedSearch.length === 0) {
          return true;
        }

        return table.number.toString().includes(normalizedSearch);
      })
      .sort((left, right) => {
        const statusDifference = statusPriority[left.status] - statusPriority[right.status];
        if (statusDifference !== 0) {
          return statusDifference;
        }

        return left.number - right.number;
      });
  }, [normalizedSearch, statusFilter, tables]);

  const quickStats = useMemo(
    () => ({
      occupied: tables.filter((table) => table.status === 'DOLU').length,
      waitingPayment: tables.filter((table) => table.status === 'ODEME_BEKLIYOR').length,
      empty: tables.filter((table) => table.status === 'BOS').length,
      ready: tables.filter((table) => tableServiceStatusById[table.id] === 'HAZIR').length,
    }),
    [tableServiceStatusById, tables],
  );

  const quickPaymentTable = useMemo(
    () =>
      filteredTables.find((table) => table.status === 'ODEME_BEKLIYOR') ??
      filteredTables.find((table) => table.orderItems.length > 0),
    [filteredTables],
  );

  const openAmount = useMemo(
    () => Object.values(totalsByTableId).reduce((sum, total) => sum + total, 0),
    [totalsByTableId],
  );

  const handleOpenOrder = useCallback(
    (tableId: string) => {
      navigate(appRoutes.adisyon(tableId));
    },
    [navigate],
  );

  const handleOpenPayment = useCallback(
    (tableId: string) => {
      navigate(appRoutes.odeme(tableId));
    },
    [navigate],
  );

  return (
    <div className="space-y-3 pb-24">
      <AppCard tone="highlight" className="p-2.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8A6B12]">Servis Ekranı</p>
            <h2 className="text-base font-semibold text-slate-900">Masalar</h2>
          </div>
          <div className="rounded-full border border-[#E9C44A]/40 bg-white px-3 py-1.5 text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">Açık Tutar</p>
            <strong className="text-sm text-slate-900">{formatCurrency(openAmount)}</strong>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap gap-2">
          <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
            Dolu: <span className="text-slate-900">{quickStats.occupied}</span>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
            Ödeme: <span className="text-slate-900">{quickStats.waitingPayment}</span>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
            Boş: <span className="text-slate-900">{quickStats.empty}</span>
          </div>
          <div className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">
            Hazır: <span className="text-slate-900">{quickStats.ready}</span>
          </div>
        </div>

        <div className="mt-2.5 space-y-2">
          <AppInput
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Masa no ara..."
            className="bg-white"
          />
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'TUMU', label: 'Tümü' },
              { value: 'BOS', label: 'Boş' },
              { value: 'DOLU', label: 'Dolu' },
              { value: 'ODEME_BEKLIYOR', label: 'Ödeme Bekliyor' },
            ].map((filter) => (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value as 'TUMU' | TableStatus)}
                className={`min-h-10 rounded-xl border px-2 py-2 text-xs font-semibold transition ${
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
      </AppCard>

      <section className="space-y-2">
        {filteredTables.map((table) => (
          <TableCardCompact
            key={table.id}
            table={table}
            serviceStatus={tableServiceStatusById[table.id] ?? 'BEKLIYOR'}
            totalAmount={totalsByTableId[table.id]}
            onOrder={handleOpenOrder}
            onPayment={handleOpenPayment}
          />
        ))}
      </section>

      {quickPaymentTable ? (
        <div className="fixed bottom-20 left-3 right-3 z-30 rounded-2xl border border-slate-200 bg-white/95 p-2.5 shadow-xl backdrop-blur lg:hidden">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>Hızlı Ödeme</span>
            <span>Masa {quickPaymentTable.number}</span>
          </div>
          <AppButton className="w-full" onClick={() => navigate(appRoutes.odeme(quickPaymentTable.id))}>
            Direkt Ödemeye Geç
          </AppButton>
        </div>
      ) : null}
    </div>
  );
};
