import { PaymentPageCompact } from './compact/PaymentPageCompact';
import { PaymentPageDesktop } from './desktop/PaymentPageDesktop';
import { useCompactPos } from '../hooks/useCompactPos';

export const PaymentPage = () => {
  const isCompactPos = useCompactPos();

  return isCompactPos ? <PaymentPageCompact /> : <PaymentPageDesktop />;
};
