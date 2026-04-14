const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const eurFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const MOCK_EXCHANGE_RATES = {
  USD: 38.9,
  EUR: 42.2,
} as const;

export const formatCurrency = (value: number) => currencyFormatter.format(value);
export const formatUsd = (value: number) => usdFormatter.format(value);
export const formatEur = (value: number) => eurFormatter.format(value);

export const convertTryToUsd = (tryAmount: number, usdRate: number = MOCK_EXCHANGE_RATES.USD) =>
  usdRate > 0 ? tryAmount / usdRate : 0;

export const convertTryToEur = (tryAmount: number, eurRate: number = MOCK_EXCHANGE_RATES.EUR) =>
  eurRate > 0 ? tryAmount / eurRate : 0;
