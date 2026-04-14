import { TableOperationsPanel } from '../components/tables/TableOperationsPanel';
import { AppCard } from '../components/ui/AppCard';
import { PageHeader } from '../components/ui/PageHeader';

export const TableOperationsPage = () => (
  <div className="space-y-4">
    <AppCard>
      <PageHeader
        title="Masa Operasyonları"
        description="Masa birleştir, masa taşı ve masa ayır işlemlerini tek ekrandan güvenli şekilde yönetin."
      />
    </AppCard>

    <TableOperationsPanel />
  </div>
);
