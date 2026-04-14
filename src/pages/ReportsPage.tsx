import { ReportCards } from '../components/reports/ReportCards';
import { AppCard } from '../components/ui/AppCard';
import { PageHeader } from '../components/ui/PageHeader';
import { usePOS } from '../state/POSContext';

export const ReportsPage = () => {
  const { transactions, tables } = usePOS();

  return (
    <div className="space-y-4">
      <AppCard>
        <PageHeader
          title="Raporlar"
          description="Veriler işlem geçmişindeki mock ve canlı transaction kayıtlarından üretilir."
        />
      </AppCard>

      <ReportCards transactions={transactions} tables={tables} />
    </div>
  );
};
