const randomDigits = (length: number) =>
  Array.from({ length }, () => Math.floor(Math.random() * 10).toString()).join('');

export const createAdisyonNo = (tableNo: number) => {
  const now = new Date();
  const stamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now
    .getDate()
    .toString()
    .padStart(2, '0')}`;

  return `AD-${stamp}-${tableNo.toString().padStart(3, '0')}-${randomDigits(2)}`;
};

export const createReferenceNo = () => `VKF${randomDigits(10)}`;

export const createCashReferenceNo = () => `NKT${randomDigits(7)}`;

export const createRefundReferenceNo = () => `IAD${randomDigits(8)}`;

export const createTransactionId = () => `txn-${Date.now()}-${randomDigits(4)}`;
export const createMenuItemId = () => `menu-${Date.now()}-${randomDigits(3)}`;
export const createOrderLogId = () => `log-${Date.now()}-${randomDigits(3)}`;

export const createToastId = () => `toast-${Date.now()}-${randomDigits(3)}`;

export const createSplitPartId = () => `split-${Date.now()}-${randomDigits(3)}`;
