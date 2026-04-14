import { CreditCard, ReceiptText, Timer } from 'lucide-react';
import { useMemo } from 'react';

import { usePOS } from '../../state/POSContext';
import { formatCurrency } from '../../utils/currency';
import { calculateTotals } from '../../utils/order';
import { getSuccessfulTransactionNetAmount } from '../../utils/transaction';

export const RightSummaryPanel = () => {
  const { tables, transactions } = usePOS();

  const summary = useMemo(() => {
    const activeTables = tables.filter((table) => table.status === 'DOLU').length;
    const pendingPaymentTables = tables.filter((table) => table.status === 'ODEME_BEKLIYOR').length;
    const openAdisyonTotal = tables.reduce(
      (sum, table) =>
        sum +
        calculateTotals(table.orderItems, {
          guestCount: table.guestCount,
          coverEnabled: table.coverEnabled,
          coverPerGuest: table.coverPerGuest,
        }).grandTotal,
      0,
    );

    const today = new Date().toISOString().slice(0, 10);
    const successfulPayments = transactions
      .filter((transaction) => transaction.createdAt.startsWith(today))
      .reduce((sum, transaction) => sum + getSuccessfulTransactionNetAmount(transaction), 0);

    return {
      activeTables,
      pendingPaymentTables,
      openAdisyonTotal,
      successfulPayments,
    };
  }, [tables, transactions]);

  return (
    <aside className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm backdrop-blur">
        <h2 className="text-sm font-semibold text-slate-800">Operasyon Özeti</h2>

        <div className="mt-3 space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2 text-slate-600">
              <ReceiptText size={16} />
              <span>Açık Masalar</span>
            </div>
            <strong className="text-slate-900">{summary.activeTables}</strong>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2 text-slate-600">
              <Timer size={16} />
              <span>Ödeme Bekleyen</span>
            </div>
            <strong className="text-slate-900">{summary.pendingPaymentTables}</strong>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
            <div className="flex items-center gap-2 text-slate-600">
              <CreditCard size={16} />
              <span>Açık Adisyon Tutarı</span>
            </div>
            <strong className="text-slate-900">{formatCurrency(summary.openAdisyonTotal)}</strong>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#E9C44A]/40 bg-[linear-gradient(180deg,#FFF8DE_0%,#FFF2C5_100%)] p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-[#765400]">Bugün Tahsil Edilen</h3>
        <p className="mt-2 text-2xl font-bold text-[#43310A]">{formatCurrency(summary.successfulPayments)}</p>
        <p className="mt-1 text-xs text-[#6C5718]">Başarılı işlemler üzerinden hesaplanır</p>
      </section>
    </aside>
  );
};
