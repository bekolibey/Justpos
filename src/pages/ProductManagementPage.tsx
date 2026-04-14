import { ProductQuickCreatePanel } from '../components/menu/ProductQuickCreatePanel';
import { AppCard } from '../components/ui/AppCard';
import { AppButton } from '../components/ui/AppButton';
import { PageHeader } from '../components/ui/PageHeader';
import { MENU_CATEGORIES } from '../data/menu';
import { usePOS } from '../state/POSContext';
import { formatCurrency } from '../utils/currency';

export const ProductManagementPage = () => {
  const { menuItems, favoriteMenuItemIds, addMenuItem, toggleFavoriteMenuItem, pushToast } = usePOS();

  return (
    <div className="space-y-4">
      <AppCard>
        <PageHeader
          title="Ürün Yönetimi"
          description="Yeni ürünleri menüye ekleyin ve mevcut ürün listesini kontrol edin."
        />
      </AppCard>

      <ProductQuickCreatePanel
        categories={MENU_CATEGORIES}
        onCreate={(input) => {
          const result = addMenuItem(input);
          pushToast(result.message, result.ok ? 'success' : 'error');
        }}
      />

      <AppCard>
        <h3 className="text-sm font-semibold text-slate-900">Mevcut Ürünler</h3>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {menuItems.map((item) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{item.category}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{item.name}</p>
                  <p className="mt-1 text-xs text-slate-600">{formatCurrency(item.price)}</p>
                </div>

                <AppButton
                  size="sm"
                  variant={favoriteMenuItemIds.includes(item.id) ? 'secondary' : 'ghost'}
                  onClick={() => toggleFavoriteMenuItem(item.id)}
                >
                  {favoriteMenuItemIds.includes(item.id) ? 'Favori' : 'Yıldızla'}
                </AppButton>
              </div>
            </div>
          ))}
        </div>
      </AppCard>
    </div>
  );
};
