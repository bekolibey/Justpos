import { useEffect, useState } from 'react';

import type { PaymentTransaction } from '../../types/pos';
import { formatCurrency } from '../../utils/currency';
import { formatDateTime } from '../../utils/date';
import { getTransactionPaymentLabel } from '../../utils/labels';
import { getTransactionDisplayAmount } from '../../utils/transaction';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../ui/FormField';
import { StatusBadge } from '../ui/StatusBadge';

interface TransactionDetailModalProps {
  transaction: PaymentTransaction | null;
  refundableAmount: number;
  onFullRefund: () => void;
  onPartialRefund: (amount: number) => void;
  onClose: () => void;
}

export const TransactionDetailModal = ({
  transaction,
  refundableAmount,
  onFullRefund,
  onPartialRefund,
  onClose,
}: TransactionDetailModalProps) => {
  const [partialAmount, setPartialAmount] = useState('');

  useEffect(() => {
    if (!transaction) {
      setPartialAmount('');
      return;
    }

    setPartialAmount(refundableAmount > 0 ? refundableAmount.toFixed(2) : '');
  }, [transaction, refundableAmount]);

  useEffect(() => {
    if (!transaction) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [transaction, onClose]);

  if (!transaction) {
    return null;
  }

  const canRefund = transaction.status === 'BASARILI' && transaction.paymentType !== 'IADE' && refundableAmount > 0;
  const partialAmountNumber = Number(partialAmount);
  const partialAmountValid =
    Number.isFinite(partialAmountNumber) && partialAmountNumber > 0 && partialAmountNumber <= refundableAmount;

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/45 md:flex md:items-center md:justify-center md:px-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="fixed bottom-0 left-0 right-0 max-h-[82vh] overflow-y-auto rounded-t-3xl bg-white p-3 shadow-2xl md:relative md:bottom-auto md:left-auto md:right-auto md:max-h-[82vh] md:w-full md:max-w-xl md:rounded-2xl md:p-5"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-slate-300 md:hidden" />

        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">İşlem Detayı</h3>
            <p className="text-sm text-slate-500">{transaction.adisyonNo}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Kapat
          </button>
        </div>

        <div className="mt-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm">
          <p className="flex items-center justify-between"><span>Tarih/Saat</span> <strong>{formatDateTime(transaction.createdAt)}</strong></p>
          <p className="flex items-center justify-between"><span>Masa No</span> <strong>{transaction.tableNo}</strong></p>
          <p className="flex items-center justify-between"><span>Adisyon No</span> <strong>{transaction.adisyonNo}</strong></p>
          <p className="flex items-center justify-between"><span>Garson</span> <strong>{transaction.waiterName ?? '-'}</strong></p>
          <p className="flex items-center justify-between"><span>Terminal No</span> <strong>{transaction.terminalNo}</strong></p>
          <p className="flex items-center justify-between"><span>Ödeme Tipi</span> <strong>{getTransactionPaymentLabel(transaction)}</strong></p>
          <p className="flex items-center justify-between"><span>Tutar</span> <strong>{formatCurrency(getTransactionDisplayAmount(transaction))}</strong></p>
          <p className="flex items-center justify-between"><span>Durum</span> <StatusBadge variant="payment" value={transaction.status} /></p>
          <p className="flex items-center justify-between"><span>Referans No</span> <strong>{transaction.referenceNo ?? '-'}</strong></p>
          <p className="flex items-center justify-between"><span>Hata Kodu</span> <strong>{transaction.errorCode ?? '-'}</strong></p>
          <p className="flex items-center justify-between"><span>İade Kaynağı</span> <strong>{transaction.refundedFromTransactionId ?? '-'}</strong></p>
        </div>

        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
          <h4 className="text-sm font-semibold text-slate-900">İade İşlemi</h4>
          <p className="mt-1 text-xs text-slate-500">İade Edilebilir Tutar: {formatCurrency(refundableAmount)}</p>

          {canRefund ? (
            <div className="mt-3 space-y-2">
              <AppButton variant="danger" size="sm" className="w-full" onClick={onFullRefund}>
                Tam İade
              </AppButton>

              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <AppInput
                  type="number"
                  min={0}
                  max={refundableAmount}
                  step={0.01}
                  value={partialAmount}
                  onChange={(event) => setPartialAmount(event.target.value)}
                  placeholder="Kısmi iade tutarı"
                />
                <AppButton
                  size="sm"
                  variant="secondary"
                  onClick={() => onPartialRefund(Number(partialAmount))}
                  disabled={!partialAmountValid}
                >
                  Kısmi İade
                </AppButton>
              </div>

              {!partialAmountValid && partialAmount.length > 0 ? (
                <p className="text-[11px] font-medium text-rose-600">
                  Kısmi iade tutarı 0&apos;dan büyük ve kalan iade tutarından küçük/eşit olmalıdır.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Bu kayıt için yeni iade işlemi başlatılamaz.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
