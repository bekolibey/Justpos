import { memo } from 'react';

import type { Table } from '../../types/pos';
import { TableCard } from './TableCard';

interface TableGridProps {
  tables: Table[];
  totalsByTableId?: Record<string, number>;
  onSelectTable: (tableId: string) => void;
}

export const TableGrid = memo(({ tables, totalsByTableId, onSelectTable }: TableGridProps) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    {tables.map((table) => (
      <TableCard
        key={table.id}
        table={table}
        totalAmount={totalsByTableId?.[table.id]}
        onSelect={onSelectTable}
      />
    ))}
  </div>
));

TableGrid.displayName = 'TableGrid';
