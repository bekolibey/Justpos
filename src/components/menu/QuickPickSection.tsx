import { memo, type ReactNode } from 'react';

import type { MenuItem } from '../../types/pos';
import { formatCurrency } from '../../utils/currency';

interface QuickPickSectionProps {
  title: string;
  icon?: ReactNode;
  items: MenuItem[];
  emptyMessage?: string;
  onPick: (item: MenuItem) => void;
}

export const QuickPickSection = memo(({ title, icon, items, emptyMessage, onPick }: QuickPickSectionProps) => {
  if (items.length === 0 && !emptyMessage) {
    return null;
  }

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-[#E9C44A]/40 bg-[#FFF7D5] text-[#7A5B00]">
          {icon}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onPick(item)}
              className="flex min-h-[74px] flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:border-[#E9C44A]/60 hover:bg-[#FFF8DE]"
            >
              <span className="line-clamp-2 text-[13px] font-semibold text-slate-900">{item.name}</span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">{item.category}</span>
                <strong className="text-[12px] text-slate-900">{formatCurrency(item.price)}</strong>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  );
});

QuickPickSection.displayName = 'QuickPickSection';
