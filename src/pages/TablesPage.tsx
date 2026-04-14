import { TablesPageCompact } from './compact/TablesPageCompact';
import { TablesPageDesktop } from './desktop/TablesPageDesktop';
import { useCompactPos } from '../hooks/useCompactPos';

export const TablesPage = () => {
  const isCompactPos = useCompactPos();

  return isCompactPos ? <TablesPageCompact /> : <TablesPageDesktop />;
};
