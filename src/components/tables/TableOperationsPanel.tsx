import { useEffect, useMemo, useState } from 'react';

import { usePOS } from '../../state/POSContext';
import { AppButton } from '../ui/AppButton';
import { AppCard } from '../ui/AppCard';
import { AppSelect } from '../ui/FormField';

interface TableOperationsPanelProps {
  compact?: boolean;
}

export const TableOperationsPanel = ({ compact = false }: TableOperationsPanelProps) => {
  const { tables, mergeTables, moveTable, splitTable, pushToast } = usePOS();

  const busyTables = useMemo(() => tables.filter((table) => table.orderItems.length > 0), [tables]);
  const emptyTables = useMemo(
    () => tables.filter((table) => table.orderItems.length === 0 && table.status === 'BOS'),
    [tables],
  );

  const [mergeSourceId, setMergeSourceId] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');

  const [moveSourceId, setMoveSourceId] = useState('');
  const [moveTargetId, setMoveTargetId] = useState('');

  const [splitSourceId, setSplitSourceId] = useState('');
  const [splitTargetId, setSplitTargetId] = useState('');
  const [splitPercent, setSplitPercent] = useState(50);

  useEffect(() => {
    if (busyTables.length === 0) {
      setMergeSourceId('');
      setMoveSourceId('');
      setSplitSourceId('');
      return;
    }

    setMergeSourceId((prev) => (busyTables.some((table) => table.id === prev) ? prev : busyTables[0].id));
    setMoveSourceId((prev) => (busyTables.some((table) => table.id === prev) ? prev : busyTables[0].id));
    setSplitSourceId((prev) => (busyTables.some((table) => table.id === prev) ? prev : busyTables[0].id));
  }, [busyTables]);

  const mergeTargets = useMemo(() => tables.filter((table) => table.id !== mergeSourceId), [tables, mergeSourceId]);
  const moveTargets = useMemo(
    () => emptyTables.filter((table) => table.id !== moveSourceId),
    [emptyTables, moveSourceId],
  );
  const splitTargets = useMemo(
    () => emptyTables.filter((table) => table.id !== splitSourceId),
    [emptyTables, splitSourceId],
  );

  useEffect(() => {
    if (mergeTargets.length === 0) {
      setMergeTargetId('');
      return;
    }

    setMergeTargetId((prev) => (mergeTargets.some((table) => table.id === prev) ? prev : mergeTargets[0].id));
  }, [mergeTargets]);

  useEffect(() => {
    if (moveTargets.length === 0) {
      setMoveTargetId('');
      return;
    }

    setMoveTargetId((prev) => (moveTargets.some((table) => table.id === prev) ? prev : moveTargets[0].id));
  }, [moveTargets]);

  useEffect(() => {
    if (splitTargets.length === 0) {
      setSplitTargetId('');
      return;
    }

    setSplitTargetId((prev) => (splitTargets.some((table) => table.id === prev) ? prev : splitTargets[0].id));
  }, [splitTargets]);

  const notifyResult = (ok: boolean, message: string) => {
    pushToast(message, ok ? 'success' : 'error');
  };

  const handleMerge = () => {
    const result = mergeTables(mergeSourceId, mergeTargetId);
    notifyResult(result.ok, result.message);
  };

  const handleMove = () => {
    const result = moveTable(moveSourceId, moveTargetId);
    notifyResult(result.ok, result.message);
  };

  const handleSplit = () => {
    const result = splitTable(splitSourceId, splitTargetId, splitPercent / 100);
    notifyResult(result.ok, result.message);
  };

  const sectionClassName = compact
    ? 'space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3'
    : 'space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5';

  return (
    <AppCard className={compact ? 'p-3' : undefined}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Masa Operasyonları</h3>
          <p className="text-xs text-slate-500">Masa birleştir, taşı ve ayır işlemlerini buradan yönetin.</p>
        </div>
      </div>

      <div className={compact ? 'space-y-3' : 'grid gap-3 xl:grid-cols-3'}>
        <section className={sectionClassName}>
          <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Masa Birleştir</h4>
          <AppSelect
            value={mergeSourceId}
            onChange={(event) => setMergeSourceId(event.target.value)}
            disabled={busyTables.length === 0}
          >
            {busyTables.length === 0 ? (
              <option value="">Açık masa yok</option>
            ) : (
              busyTables.map((table) => (
                <option key={table.id} value={table.id}>
                  Kaynak: Masa {table.number}
                </option>
              ))
            )}
          </AppSelect>
          <AppSelect
            value={mergeTargetId}
            onChange={(event) => setMergeTargetId(event.target.value)}
            disabled={mergeTargets.length === 0}
          >
            {mergeTargets.length === 0 ? (
              <option value="">Hedef masa yok</option>
            ) : (
              mergeTargets.map((table) => (
                <option key={table.id} value={table.id}>
                  Hedef: Masa {table.number}
                </option>
              ))
            )}
          </AppSelect>
          <AppButton className="w-full" size="sm" onClick={handleMerge} disabled={!mergeSourceId || !mergeTargetId}>
            Masayı Birleştir
          </AppButton>
        </section>

        <section className={sectionClassName}>
          <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Masa Taşı</h4>
          <AppSelect
            value={moveSourceId}
            onChange={(event) => setMoveSourceId(event.target.value)}
            disabled={busyTables.length === 0}
          >
            {busyTables.length === 0 ? (
              <option value="">Açık masa yok</option>
            ) : (
              busyTables.map((table) => (
                <option key={table.id} value={table.id}>
                  Kaynak: Masa {table.number}
                </option>
              ))
            )}
          </AppSelect>
          <AppSelect
            value={moveTargetId}
            onChange={(event) => setMoveTargetId(event.target.value)}
            disabled={moveTargets.length === 0}
          >
            {moveTargets.length === 0 ? (
              <option value="">Boş hedef masa yok</option>
            ) : (
              moveTargets.map((table) => (
                <option key={table.id} value={table.id}>
                  Hedef: Masa {table.number}
                </option>
              ))
            )}
          </AppSelect>
          <AppButton className="w-full" size="sm" onClick={handleMove} disabled={!moveSourceId || !moveTargetId}>
            Masayı Taşı
          </AppButton>
        </section>

        <section className={sectionClassName}>
          <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Masa Ayır</h4>
          <AppSelect
            value={splitSourceId}
            onChange={(event) => setSplitSourceId(event.target.value)}
            disabled={busyTables.length === 0}
          >
            {busyTables.length === 0 ? (
              <option value="">Açık masa yok</option>
            ) : (
              busyTables.map((table) => (
                <option key={table.id} value={table.id}>
                  Kaynak: Masa {table.number}
                </option>
              ))
            )}
          </AppSelect>
          <AppSelect
            value={splitTargetId}
            onChange={(event) => setSplitTargetId(event.target.value)}
            disabled={splitTargets.length === 0}
          >
            {splitTargets.length === 0 ? (
              <option value="">Boş hedef masa yok</option>
            ) : (
              splitTargets.map((table) => (
                <option key={table.id} value={table.id}>
                  Yeni Masa: {table.number}
                </option>
              ))
            )}
          </AppSelect>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-600">Ayırma Oranı: %{splitPercent}</span>
            <input
              type="range"
              min={20}
              max={80}
              step={5}
              value={splitPercent}
              onChange={(event) => setSplitPercent(Number(event.target.value))}
              disabled={!splitSourceId || !splitTargetId}
              className="w-full accent-[#D7AD2E]"
            />
          </label>

          <AppButton className="w-full" size="sm" onClick={handleSplit} disabled={!splitSourceId || !splitTargetId}>
            Masayı Ayır
          </AppButton>
        </section>
      </div>
    </AppCard>
  );
};
