import { memo } from 'react';

import type { PaymentTransaction } from '../../types/pos';
import { formatCurrency } from '../../utils/currency';
import { formatDateTime } from '../../utils/date';
import { getTransactionPaymentLabel } from '../../utils/labels';
import { getTransactionDisplayAmount } from '../../utils/transaction';
import { StatusBadge } from '../ui/StatusBadge';

interface TransactionTableProps {
  transactions: PaymentTransaction[];
  onSelect: (transaction: PaymentTransaction) => void;
}

export const TransactionTable = memo(({ transactions, onSelect }: TransactionTableProps) => {
  if (transactions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
        <p className="text-sm font-semibold text-slate-700">Filtreye uygun işlem bulunamadı.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 md:hidden">
        {transactions.map((transaction) => (
          <article key={transaction.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">Masa {transaction.tableNo}</p>
                <p className="text-xs text-slate-500">{formatDateTime(transaction.createdAt)}</p>
              </div>
              <StatusBadge variant="payment" value={transaction.status} />
            </div>

            <div className="mt-2 grid gap-1 text-xs text-slate-600">
              <p className="flex items-center justify-between">
                <span>Adisyon</span>
                <strong className="text-slate-900">{transaction.adisyonNo}</strong>
              </p>
              <p className="flex items-center justify-between">
                <span>Garson</span>
                <strong className="text-slate-900">{transaction.waiterName ?? '-'}</strong>
              </p>
              <p className="flex items-center justify-between">
                <span>Terminal</span>
                <strong className="text-slate-900">{transaction.terminalNo}</strong>
              </p>
              <p className="flex items-center justify-between">
                <span>Ödeme</span>
                <strong className="text-slate-900">{getTransactionPaymentLabel(transaction)}</strong>
              </p>
              <p className="flex items-center justify-between">
                <span>Tutar</span>
                <strong className={transaction.paymentType === 'IADE' ? 'text-rose-700' : 'text-slate-900'}>
                  {formatCurrency(getTransactionDisplayAmount(transaction))}
                </strong>
              </p>
            </div>

            <button
              type="button"
              onClick={() => onSelect(transaction)}
              className="mt-3 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white active:scale-[0.99]"
            >
              İşlem Detayı
            </button>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="px-3 py-3">Tarih/Saat</th>
              <th className="px-3 py-3">Masa No</th>
              <th className="px-3 py-3">Adisyon No</th>
              <th className="px-3 py-3">Garson</th>
              <th className="px-3 py-3">Terminal No</th>
              <th className="px-3 py-3">Ödeme Tipi</th>
              <th className="px-3 py-3">Tutar</th>
              <th className="px-3 py-3">Durum</th>
              <th className="px-3 py-3">Referans No</th>
              <th className="px-3 py-3">İşlem</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {transactions.map((transaction) => (
              <tr
                key={transaction.id}
                className="transition hover:bg-[#FFF9E7]"
              >
                <td className="px-3 py-3 text-slate-700">{formatDateTime(transaction.createdAt)}</td>
                <td className="px-3 py-3 font-semibold text-slate-900">{transaction.tableNo}</td>
                <td className="px-3 py-3 text-slate-700">{transaction.adisyonNo}</td>
                <td className="px-3 py-3 text-slate-700">{transaction.waiterName ?? '-'}</td>
                <td className="px-3 py-3 text-slate-700">{transaction.terminalNo}</td>
                <td className="px-3 py-3 text-slate-700">{getTransactionPaymentLabel(transaction)}</td>
                <td
                  className={`px-3 py-3 font-semibold ${
                    transaction.paymentType === 'IADE' ? 'text-rose-700' : 'text-slate-900'
                  }`}
                >
                  {formatCurrency(getTransactionDisplayAmount(transaction))}
                </td>
                <td className="px-3 py-3">
                  <StatusBadge variant="payment" value={transaction.status} />
                </td>
                <td className="px-3 py-3 text-slate-700">{transaction.referenceNo ?? '-'}</td>
                <td className="px-3 py-3">
                  <button
                    type="button"
                    onClick={() => onSelect(transaction)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                  >
                    Detay
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>
    </>
  );
});

TransactionTable.displayName = 'TransactionTable';
