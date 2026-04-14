import { memo, useMemo } from 'react';
import { Plus, Star } from 'lucide-react';

import type { MenuItem, PortionMultiplier } from '../../types/pos';
import { formatCurrency } from '../../utils/currency';
import { getPortionOptions } from '../../utils/portion';

interface ProductCardProps {
  item: MenuItem;
  onAdd: (item: MenuItem, portionMultiplier?: PortionMultiplier) => void;
  onConfigure?: (item: MenuItem) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (menuItemId: string) => void;
  layout?: 'default' | 'compact';
}

export const ProductCard = memo(({
  item,
  onAdd,
  onConfigure,
  isFavorite = false,
  onToggleFavorite,
  layout = 'default',
}: ProductCardProps) => {
  const portionOptions = useMemo(() => getPortionOptions(item), [item]);
  const quickPortionOptions = portionOptions.slice(0, 2);
  const buttonGridClass = quickPortionOptions.length === 1 ? 'grid-cols-1' : 'grid-cols-2';
  const isCompact = layout === 'compact';

  return (
    <article
      className={`group flex w-full flex-col rounded-xl border border-slate-200 bg-white text-left transition hover:border-[#E9C44A]/60 hover:shadow-sm ${
        isCompact ? 'min-h-[148px] p-2.5' : 'p-3'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={`${isCompact ? 'text-[11px]' : 'text-xs'} font-medium text-slate-500`}>{item.category}</span>
          <span className={`${isCompact ? 'mt-0.5 line-clamp-2 text-[13px]' : 'mt-1 text-sm'} block font-semibold text-slate-900`}>
            {item.name}
          </span>
        </div>

        {onToggleFavorite ? (
          <button
            type="button"
            onClick={() => onToggleFavorite(item.id)}
            aria-label={isFavorite ? 'Favoriden çıkar' : 'Favoriye ekle'}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition ${
              isFavorite
                ? 'border-[#E9C44A]/60 bg-[#FFF7D5] text-[#A67A00]'
                : 'border-slate-200 bg-white text-slate-400 hover:border-[#E9C44A]/50 hover:text-[#A67A00]'
            }`}
          >
            <Star size={14} className={isFavorite ? 'fill-current' : ''} />
          </button>
        ) : null}
      </div>

      <div className={`mt-2 rounded-lg border border-slate-100 bg-slate-50 text-slate-600 ${isCompact ? 'px-2 py-2 text-[11px]' : 'px-2 py-1.5 text-xs'}`}>
        {portionOptions.map((rate, index) => (
          <span key={rate}>
            {index > 0 ? ' • ' : null}
            {rate} Porsiyon: <strong>{formatCurrency(Number((item.price * rate).toFixed(2)))}</strong>
          </span>
        ))}
      </div>

      <div className={`mt-auto grid ${buttonGridClass} gap-2 pt-3`}>
        {quickPortionOptions.map((rate, index) => (
          <button
            key={rate}
            type="button"
            onClick={() => onAdd(item, rate)}
            className={`inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border ${isCompact ? 'px-1.5 py-2 text-[11px]' : 'px-2 py-1.5 text-xs'} font-semibold transition ${
              index === 1
                ? 'border-[#E9C44A]/50 bg-[#FFF8DE] text-[#7A5B00] hover:bg-[#FFF2C6]'
                : 'border-slate-200 text-slate-600 hover:border-[#E9C44A]/70 hover:bg-[#FFF7D5] hover:text-[#7A5B00]'
            }`}
          >
            <Plus size={14} /> {rate} Porsiyon
          </button>
        ))}
      </div>

      {onConfigure ? (
        <button
          type="button"
          onClick={() => onConfigure(item)}
          className={`mt-2 rounded-lg border border-slate-200 ${isCompact ? 'px-2 py-2 text-[11px]' : 'px-2 py-1.5 text-xs'} font-semibold text-slate-600 transition hover:border-[#D7AD2E]/70 hover:bg-[#FFF7D5] hover:text-[#7A5B00]`}
        >
          {isCompact ? 'Seçenekli' : 'Seçenekli Ekle (Modifier + Seat)'}
        </button>
      ) : null}
    </article>
  );
});

ProductCard.displayName = 'ProductCard';
