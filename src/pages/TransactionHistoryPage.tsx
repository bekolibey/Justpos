import { useCallback, useMemo, useState } from 'react';

import { TransactionDetailModal } from '../components/history/TransactionDetailModal';
import { TransactionTable } from '../components/history/TransactionTable';
import { AppCard } from '../components/ui/AppCard';
import { AppInput, AppSelect, FieldLabel } from '../components/ui/FormField';
import { PageHeader } from '../components/ui/PageHeader';
import { usePOS } from '../state/POSContext';
import type { PaymentStatus, PaymentTransaction, PaymentType } from '../types/pos';

export const TransactionHistoryPage = () => {
  const { tables, terminals, transactions, getRefundableAmount, refundTransaction, pushToast } = usePOS();

  const [dateFilter, setDateFilter] = useState('');
  const [tableFilter, setTableFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TUMU' | PaymentStatus>('TUMU');
  const [paymentFilter, setPaymentFilter] = useState<'TUMU' | PaymentType>('TUMU');
  const [terminalFilter, setTerminalFilter] = useState('');
  const [waiterFilter, setWaiterFilter] = useState('');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const parsedTableFilter = tableFilter ? Number(tableFilter) : null;

  const transactionsById = useMemo(
    () =>
      transactions.reduce<Record<string, PaymentTransaction>>((accumulator, transaction) => {
        accumulator[transaction.id] = transaction;
        return accumulator;
      }, {}),
    [transactions],
  );

  const selectedTransaction = selectedTransactionId ? transactionsById[selectedTransactionId] ?? null : null;

  const waiterOptions = useMemo(
    () =>
      Array.from(
        new Set(
          transactions
            .map((transaction) => transaction.waiterName?.trim())
            .filter((waiterName): waiterName is string => Boolean(waiterName)),
        ),
      ).sort((a, b) => a.localeCompare(b, 'tr')),
    [transactions],
  );

  const selectedRefundableAmount = useMemo(
    () => (selectedTransactionId ? getRefundableAmount(selectedTransactionId) : 0),
    [getRefundableAmount, selectedTransactionId],
  );

  const sortedTransactions = useMemo(
    () => [...transactions].sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1)),
    [transactions],
  );

  const filteredTransactions = useMemo(
    () =>
      sortedTransactions
        .filter((transaction) => {
          if (dateFilter && !transaction.createdAt.startsWith(dateFilter)) {
            return false;
          }

          if (parsedTableFilter !== null && transaction.tableNo !== parsedTableFilter) {
            return false;
          }

          if (statusFilter !== 'TUMU' && transaction.status !== statusFilter) {
            return false;
          }

          if (paymentFilter !== 'TUMU' && transaction.paymentType !== paymentFilter) {
            return false;
          }

          if (terminalFilter && transaction.terminalNo !== terminalFilter) {
            return false;
          }

          if (waiterFilter && transaction.waiterName !== waiterFilter) {
            return false;
          }

          return true;
        }),
    [dateFilter, paymentFilter, statusFilter, parsedTableFilter, terminalFilter, waiterFilter, sortedTransactions],
  );

  const handleSelectTransaction = useCallback((transaction: PaymentTransaction) => {
    setSelectedTransactionId(transaction.id);
  }, []);

  const handleCloseModal = useCallback(() => {
    setSelectedTransactionId(null);
  }, []);

  return (
    <div className="space-y-4">
      <AppCard>
        <PageHeader
          title="İşlem Geçmişi"
          description="Tüm ödeme hareketlerini filtreleyip detayını inceleyebilirsiniz."
        />

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-6">
          <label className="space-y-1">
            <FieldLabel label="Tarih" className="text-xs" />
            <AppInput
              type="date"
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
            />
          </label>

          <label className="space-y-1">
            <FieldLabel label="Masa No" className="text-xs" />
            <AppSelect
              value={tableFilter}
              onChange={(event) => setTableFilter(event.target.value)}
            >
              <option value="">Tümü</option>
              {tables.map((table) => (
                <option key={table.id} value={table.number}>
                  Masa {table.number}
                </option>
              ))}
            </AppSelect>
          </label>

          <label className="space-y-1">
            <FieldLabel label="Durum" className="text-xs" />
            <AppSelect
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'TUMU' | PaymentStatus)}
            >
              <option value="TUMU">Tümü</option>
              <option value="BASARILI">Başarılı</option>
              <option value="BASARISIZ">Başarısız</option>
              <option value="BEKLIYOR">Bekliyor</option>
            </AppSelect>
          </label>

          <label className="space-y-1">
            <FieldLabel label="Ödeme Tipi" className="text-xs" />
            <AppSelect
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value as 'TUMU' | PaymentType)}
            >
              <option value="TUMU">Tümü</option>
              <option value="NAKIT">Nakit</option>
              <option value="KART">Kart</option>
              <option value="BOLUNMUS">Bölünmüş Ödeme</option>
              <option value="IADE">İade</option>
            </AppSelect>
          </label>

          <label className="space-y-1">
            <FieldLabel label="Terminal" className="text-xs" />
            <AppSelect
              value={terminalFilter}
              onChange={(event) => setTerminalFilter(event.target.value)}
            >
              <option value="">Tümü</option>
              {terminals.map((terminal) => (
                <option key={terminal.id} value={terminal.terminalNo}>
                  {terminal.terminalNo}
                </option>
              ))}
            </AppSelect>
          </label>

          <label className="space-y-1">
            <FieldLabel label="Garson" className="text-xs" />
            <AppSelect
              value={waiterFilter}
              onChange={(event) => setWaiterFilter(event.target.value)}
            >
              <option value="">Tümü</option>
              {waiterOptions.map((waiterName) => (
                <option key={waiterName} value={waiterName}>
                  {waiterName}
                </option>
              ))}
            </AppSelect>
          </label>
        </div>
      </AppCard>

      <TransactionTable transactions={filteredTransactions} onSelect={handleSelectTransaction} />

      <TransactionDetailModal
        transaction={selectedTransaction}
        refundableAmount={selectedRefundableAmount}
        onFullRefund={() => {
          if (!selectedTransaction) {
            return;
          }

          const result = refundTransaction({
            transactionId: selectedTransaction.id,
          });
          pushToast(result.message, result.ok ? 'success' : 'error');
        }}
        onPartialRefund={(amount) => {
          if (!selectedTransaction) {
            return;
          }

          const result = refundTransaction({
            transactionId: selectedTransaction.id,
            amount,
          });
          pushToast(result.message, result.ok ? 'success' : 'error');
        }}
        onClose={handleCloseModal}
      />
    </div>
  );
};
