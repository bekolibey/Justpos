import type { PaymentTransaction } from '../types/pos';

export const getTransactionDisplayAmount = (transaction: PaymentTransaction) =>
  transaction.paymentType === 'IADE' ? -transaction.amount : transaction.amount;

export const getSuccessfulTransactionNetAmount = (transaction: PaymentTransaction) => {
  if (transaction.status !== 'BASARILI') {
    return 0;
  }

  return getTransactionDisplayAmount(transaction);
};
