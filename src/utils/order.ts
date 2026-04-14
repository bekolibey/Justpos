import type { OrderItem, Table, TableStatus } from '../types/pos';

export const SERVICE_FEE_RATE = 0.05;
export const DEFAULT_COVER_PER_GUEST = 35;

interface TotalsOptions {
  guestCount?: number;
  coverEnabled?: boolean;
  coverPerGuest?: number;
}

interface TotalsResult {
  subtotal: number;
  serviceFee: number;
  coverCharge: number;
  grandTotal: number;
}

const totalsCache = new WeakMap<OrderItem[], Map<string, TotalsResult>>();

const getTotalsCacheKey = (options?: TotalsOptions) => {
  const guestCount = Math.max(0, options?.guestCount ?? 0);
  const coverEnabled = options?.coverEnabled ?? false;
  const coverPerGuest = options?.coverPerGuest ?? DEFAULT_COVER_PER_GUEST;
  return `${guestCount}|${coverEnabled ? 1 : 0}|${coverPerGuest}`;
};

export const calculateSubtotal = (items: OrderItem[]) =>
  items.reduce((sum, item) => {
    const status = item.itemStatus ?? 'AKTIF';

    if (status !== 'AKTIF') {
      return sum;
    }

    return sum + item.price * item.quantity;
  }, 0);

export const calculateTotals = (items: OrderItem[], options?: TotalsOptions): TotalsResult => {
  const cacheKey = getTotalsCacheKey(options);
  const itemCache = totalsCache.get(items);
  const cached = itemCache?.get(cacheKey);
  if (cached) {
    return cached;
  }

  const subtotal = calculateSubtotal(items);
  const serviceFee = Number((subtotal * SERVICE_FEE_RATE).toFixed(2));
  const coverEnabled = options?.coverEnabled ?? false;
  const coverPerGuest = options?.coverPerGuest ?? DEFAULT_COVER_PER_GUEST;
  const coverCharge = coverEnabled ? Number((Math.max(0, options?.guestCount ?? 0) * coverPerGuest).toFixed(2)) : 0;
  const grandTotal = Number((subtotal + serviceFee + coverCharge).toFixed(2));

  const result = {
    subtotal,
    serviceFee,
    coverCharge,
    grandTotal,
  };

  const nextItemCache = itemCache ?? new Map<string, TotalsResult>();
  nextItemCache.set(cacheKey, result);
  if (!itemCache) {
    totalsCache.set(items, nextItemCache);
  }

  return result;
};

export const resolveStatusAfterOrderChange = (items: OrderItem[], currentStatus: TableStatus): TableStatus => {
  const activeItems = items.filter((item) => (item.itemStatus ?? 'AKTIF') === 'AKTIF');

  if (activeItems.length === 0) {
    return 'BOS';
  }

  if (currentStatus === 'ODEME_BEKLIYOR' || currentStatus === 'ODENDI') {
    return 'DOLU';
  }

  return currentStatus === 'BOS' ? 'DOLU' : currentStatus;
};

export const tableTotal = (table: Table) =>
  calculateTotals(table.orderItems, {
    guestCount: table.guestCount,
    coverEnabled: table.coverEnabled,
    coverPerGuest: table.coverPerGuest,
  }).grandTotal;

export const tableProductCount = (table: Table) => table.orderItems.reduce((count, item) => count + item.quantity, 0);
