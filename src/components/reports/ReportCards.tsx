import type { PaymentTransaction, Table } from '../../types/pos';
import { formatCurrency } from '../../utils/currency';
import { getSuccessfulTransactionNetAmount } from '../../utils/transaction';

interface ReportCardsProps {
  transactions: PaymentTransaction[];
  tables: Table[];
}

export const ReportCards = ({ transactions, tables }: ReportCardsProps) => {
  const todayPrefix = new Date().toISOString().slice(0, 10);
  const todayTransactions = transactions.filter((transaction) => transaction.createdAt.startsWith(todayPrefix));

  const dailyRevenue = todayTransactions
    .reduce((sum, transaction) => sum + getSuccessfulTransactionNetAmount(transaction), 0);

  const cardRevenue = todayTransactions
    .filter(
      (transaction) =>
        transaction.status === 'BASARILI' &&
        (transaction.paymentType === 'KART' ||
          transaction.splitMethod === 'KART' ||
          (transaction.paymentType === 'IADE' &&
            (transaction.refundOfPaymentType === 'KART' || transaction.refundOfPaymentType === 'BOLUNMUS'))),
    )
    .reduce((sum, transaction) => sum + (transaction.paymentType === 'IADE' ? -transaction.amount : transaction.amount), 0);

  const cashRevenue = todayTransactions
    .filter(
      (transaction) =>
        transaction.status === 'BASARILI' &&
        (transaction.paymentType === 'NAKIT' ||
          transaction.splitMethod === 'NAKIT' ||
          (transaction.paymentType === 'IADE' && transaction.refundOfPaymentType === 'NAKIT')),
    )
    .reduce((sum, transaction) => sum + (transaction.paymentType === 'IADE' ? -transaction.amount : transaction.amount), 0);

  const failedCount = todayTransactions.filter((transaction) => transaction.status === 'BASARISIZ').length;

  const tablePerformance = tables.map((table) => {
    const total = transactions
      .filter((transaction) => transaction.tableId === table.id)
      .reduce((sum, transaction) => sum + getSuccessfulTransactionNetAmount(transaction), 0);

    return {
      tableNo: table.number,
      total,
    };
  });

  const topTableTotal = Math.max(0, ...tablePerformance.map((item) => item.total));

  const terminalMap = new Map<string, number>();
  transactions.forEach((transaction) => {
    terminalMap.set(transaction.terminalNo, (terminalMap.get(transaction.terminalNo) ?? 0) + 1);
  });

  const terminalDistribution = [...terminalMap.entries()].map(([terminalNo, count]) => ({ terminalNo, count }));
  const topTerminalCount = Math.max(0, ...terminalDistribution.map((item) => item.count));

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Günlük Ciro</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(dailyRevenue)}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Kart Tahsilatı</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(cardRevenue)}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Nakit Tahsilatı</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(cashRevenue)}</p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Başarısız İşlem</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">{failedCount}</p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Masa Bazlı Performans</h3>
          <div className="mt-3 space-y-2">
            {tablePerformance
              .sort((a, b) => b.total - a.total)
              .slice(0, 6)
              .map((item) => (
                <div key={item.tableNo} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>Masa {item.tableNo}</span>
                    <strong>{formatCurrency(item.total)}</strong>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-[#E9C44A]"
                      style={{
                        width: `${topTableTotal > 0 ? Math.max(6, (item.total / topTableTotal) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Terminal Bazlı İşlem Dağılımı</h3>
          <div className="mt-3 space-y-2">
            {terminalDistribution
              .sort((a, b) => b.count - a.count)
              .map((item) => (
                <div key={item.terminalNo} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span>{item.terminalNo}</span>
                    <strong>{item.count} işlem</strong>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-slate-700"
                      style={{
                        width: `${topTerminalCount > 0 ? Math.max(10, (item.count / topTerminalCount) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
};
