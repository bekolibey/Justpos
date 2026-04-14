import type { PaymentStatus, PaymentTransaction, PaymentType, ServiceStatus, SplitPartMethod, TableStatus } from '../types/pos';

export const TABLE_STATUS_LABELS: Record<TableStatus, string> = {
  BOS: 'Boş',
  DOLU: 'Dolu',
  ODEME_BEKLIYOR: 'Ödeme Bekliyor',
  ODENDI: 'Ödendi',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  BEKLIYOR: 'Bekliyor',
  BASARILI: 'Başarılı',
  BASARISIZ: 'Başarısız',
};

export const SERVICE_STATUS_LABELS: Record<ServiceStatus, string> = {
  BEKLIYOR: 'Bekliyor',
  MUTFAKTA: 'Mutfakta',
  HAZIR: 'Hazır',
  SERVISTE: 'Serviste',
};

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  NAKIT: 'Nakit',
  KART: 'Kart',
  BOLUNMUS: 'Bölünmüş Ödeme',
  IPTAL: 'İptal',
  IADE: 'İade',
};

export const SPLIT_METHOD_LABELS: Record<SplitPartMethod, string> = {
  NAKIT: 'Nakit',
  KART: 'Kart',
};

export const getTransactionPaymentLabel = (transaction: PaymentTransaction) => {
  if (transaction.paymentType === 'IADE') {
    if (transaction.refundOfPaymentType) {
      return `İade (${PAYMENT_TYPE_LABELS[transaction.refundOfPaymentType]})`;
    }

    return PAYMENT_TYPE_LABELS.IADE;
  }

  if (transaction.paymentType !== 'BOLUNMUS') {
    return PAYMENT_TYPE_LABELS[transaction.paymentType];
  }

  if (!transaction.splitMethod) {
    return PAYMENT_TYPE_LABELS.BOLUNMUS;
  }

  return `${PAYMENT_TYPE_LABELS.BOLUNMUS} (${SPLIT_METHOD_LABELS[transaction.splitMethod]})`;
};
