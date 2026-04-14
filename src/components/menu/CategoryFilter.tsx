import { memo } from 'react';

import type { MenuCategory } from '../../types/pos';

interface CategoryFilterProps {
  categories: MenuCategory[];
  selected: MenuCategory | 'Tümü';
  onSelect: (category: MenuCategory | 'Tümü') => void;
  layout?: 'default' | 'compact';
}

export const CategoryFilter = memo(({ categories, selected, onSelect, layout = 'default' }: CategoryFilterProps) => (
  <div
    className={
      layout === 'compact'
        ? 'grid grid-cols-2 gap-2'
        : 'flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'
    }
  >
    <button
      type="button"
      onClick={() => onSelect('Tümü')}
      className={`${layout === 'compact' ? 'min-h-11 px-2.5 py-2 text-xs font-semibold' : 'shrink-0 px-3 py-1.5 text-sm font-medium'} rounded-lg border transition ${
        selected === 'Tümü'
          ? 'border-[#E9C44A] bg-[#FFF7D5] text-[#7A5B00]'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
      }`}
    >
      Tümü
    </button>

    {categories.map((category) => (
      <button
        key={category}
        type="button"
        onClick={() => onSelect(category)}
        className={`${layout === 'compact' ? 'min-h-11 px-2.5 py-2 text-xs font-semibold' : 'shrink-0 px-3 py-1.5 text-sm font-medium'} rounded-lg border transition ${
          selected === category
            ? 'border-[#E9C44A] bg-[#FFF7D5] text-[#7A5B00]'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
        }`}
      >
        {category}
      </button>
    ))}
  </div>
));

CategoryFilter.displayName = 'CategoryFilter';
