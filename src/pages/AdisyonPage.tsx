import { AdisyonPageCompact } from './compact/AdisyonPageCompact';
import { AdisyonPageDesktop } from './desktop/AdisyonPageDesktop';
import { useCompactPos } from '../hooks/useCompactPos';

export const AdisyonPage = () => {
  const isCompactPos = useCompactPos();

  return isCompactPos ? <AdisyonPageCompact /> : <AdisyonPageDesktop />;
};
