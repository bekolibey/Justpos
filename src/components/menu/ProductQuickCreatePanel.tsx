import { PlusCircle } from 'lucide-react';
import { useState } from 'react';

import type { MenuCategory } from '../../types/pos';
import { AppButton } from '../ui/AppButton';
import { AppInput, AppSelect, FieldLabel } from '../ui/FormField';

interface ProductQuickCreatePanelProps {
  categories: MenuCategory[];
  onCreate: (input: { name: string; category: MenuCategory; price: number }) => void;
}

export const ProductQuickCreatePanel = ({ categories, onCreate }: ProductQuickCreatePanelProps) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MenuCategory>(categories[0]);
  const [price, setPrice] = useState('');

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center gap-2">
        <PlusCircle size={16} className="text-[#8A6A06]" />
        <h4 className="text-sm font-semibold text-slate-900">Hızlı Ürün Ekle</h4>
      </div>

      <div className="grid gap-2 md:grid-cols-[1.2fr_0.9fr_0.7fr_auto]">
        <label className="space-y-1">
          <FieldLabel label="Ürün Adı" className="text-xs" />
          <AppInput value={name} onChange={(event) => setName(event.target.value)} placeholder="Örn: Fanta" />
        </label>

        <label className="space-y-1">
          <FieldLabel label="Kategori" className="text-xs" />
          <AppSelect value={category} onChange={(event) => setCategory(event.target.value as MenuCategory)}>
            {categories.map((itemCategory) => (
              <option key={itemCategory} value={itemCategory}>
                {itemCategory}
              </option>
            ))}
          </AppSelect>
        </label>

        <label className="space-y-1">
          <FieldLabel label="Fiyat" className="text-xs" />
          <AppInput
            type="number"
            min={0}
            step={0.01}
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="0.00"
          />
        </label>

        <div className="flex items-end">
          <AppButton
            className="w-full"
            size="sm"
            onClick={() => {
              onCreate({
                name,
                category,
                price: Number(price),
              });
              setName('');
              setPrice('');
            }}
            disabled={!name.trim() || Number(price) <= 0}
          >
            Ürün Ekle
          </AppButton>
        </div>
      </div>
    </section>
  );
};
