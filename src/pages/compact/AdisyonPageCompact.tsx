import { ArrowLeft, ArrowRight, Flame, History, Search, Star } from 'lucide-react';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { CategoryFilter } from '../../components/menu/CategoryFilter';
import { AddToOrderModal } from '../../components/menu/AddToOrderModal';
import { ProductCard } from '../../components/menu/ProductCard';
import { QuickPickSection } from '../../components/menu/QuickPickSection';
import { OrderSummary } from '../../components/payment/OrderSummary';
import { AppButton } from '../../components/ui/AppButton';
import { ServiceStatusBadge } from '../../components/ui/ServiceStatusBadge';
import { appRoutes } from '../../constants/routes';
import { MENU_CATEGORIES } from '../../data/menu';
import { usePOS } from '../../state/POSContext';
import type { MenuCategory, MenuItem, PortionMultiplier } from '../../types/pos';
import { formatCurrency } from '../../utils/currency';
import { calculateTotals } from '../../utils/order';

export const AdisyonPageCompact = () => {
  const orderedCategories = useMemo<MenuCategory[]>(() => {
    const preferredOrder: MenuCategory[] = ['Ana Yemek', 'Başlangıç', 'İçecek', 'Tatlı', 'Yan Ürün'];
    return preferredOrder.filter((category) => MENU_CATEGORIES.includes(category));
  }, []);
  const navigate = useNavigate();
  const { tableId } = useParams<{ tableId: string }>();
  const {
    tables,
    menuItems,
    favoriteMenuItemIds,
    recentMenuItemIds,
    tableServiceStatusById,
    waiters,
    toggleFavoriteMenuItem,
    addConfiguredProductToTable,
    addProductToTable,
    incrementOrderItem,
    decrementOrderItem,
    setOrderItemSeat,
    markOrderItem,
    restoreOrderItem,
    setTableGuestCount,
    setTableCover,
    setTableServiceStatus,
    setTableWaiter,
    pushToast,
  } = usePOS();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'Tümü'>('Ana Yemek');
  const [activePanel, setActivePanel] = useState<'urunler' | 'adisyon'>('urunler');
  const [configuredItem, setConfiguredItem] = useState<MenuItem | null>(null);
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const table = useMemo(() => tables.find((item) => item.id === tableId), [tableId, tables]);
  const activeTableId = table?.id ?? tableId ?? '';

  const filteredMenuItems = useMemo(() => {
    const normalizedSearchTerm = deferredSearchTerm.trim().toLocaleLowerCase('tr');

    return menuItems.filter((item) => {
      const matchSearch = item.name.toLocaleLowerCase('tr').includes(normalizedSearchTerm);
      const matchCategory = selectedCategory === 'Tümü' || item.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [deferredSearchTerm, menuItems, selectedCategory]);

  const recentQuickItems = useMemo(
    () =>
      recentMenuItemIds
        .map((menuItemId) => menuItems.find((item) => item.id === menuItemId))
        .filter((item): item is MenuItem => Boolean(item))
        .slice(0, 4),
    [menuItems, recentMenuItemIds],
  );

  const popularQuickItems = useMemo(() => {
    const popularityMap = new Map<string, number>();

    tables.forEach((tableEntry) => {
      tableEntry.orderItems.forEach((orderItem) => {
        const itemId = orderItem.baseMenuItemId ?? orderItem.menuItemId.split('::')[0] ?? orderItem.menuItemId;
        popularityMap.set(itemId, (popularityMap.get(itemId) ?? 0) + orderItem.quantity);
      });
    });

    return [...popularityMap.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([menuItemId]) => menuItems.find((item) => item.id === menuItemId))
      .filter((item): item is MenuItem => Boolean(item))
      .filter((item) => !recentMenuItemIds.includes(item.id))
      .slice(0, 4);
  }, [menuItems, recentMenuItemIds, tables]);

  const favoriteQuickItems = useMemo(
    () =>
      favoriteMenuItemIds
        .map((menuItemId) => menuItems.find((item) => item.id === menuItemId))
        .filter((item): item is MenuItem => Boolean(item))
        .slice(0, 6),
    [favoriteMenuItemIds, menuItems],
  );

  const totals = useMemo(
    () =>
      calculateTotals(table?.orderItems ?? [], {
        guestCount: table?.guestCount,
        coverEnabled: table?.coverEnabled,
        coverPerGuest: table?.coverPerGuest,
      }),
    [table?.coverEnabled, table?.coverPerGuest, table?.guestCount, table?.orderItems],
  );
  const waiterOptions = useMemo(() => [...waiters], [waiters]);
  const serviceStatus = tableServiceStatusById[activeTableId] ?? 'BEKLIYOR';

  const navigateTables = useCallback(() => navigate(appRoutes.tables), [navigate]);

  const navigatePayment = useCallback(() => {
    if (!activeTableId) {
      return;
    }

    navigate(appRoutes.odeme(activeTableId));
  }, [activeTableId, navigate]);

  const handleAddProduct = useCallback(
    (selectedItem: MenuItem, portionMultiplier: PortionMultiplier = 1) => {
      if (!activeTableId) {
        return;
      }

      addProductToTable(activeTableId, selectedItem, portionMultiplier);
      pushToast(
        `${selectedItem.name}${portionMultiplier === 1 ? '' : ` (${portionMultiplier} Porsiyon)`} eklendi.`,
        'success',
      );
    },
    [activeTableId, addProductToTable, pushToast],
  );

  const handleConfigureItem = useCallback((selectedItem: MenuItem) => setConfiguredItem(selectedItem), []);

  const handleIncreaseItem = useCallback(
    (menuItemId: string) => {
      if (!activeTableId) {
        return;
      }

      incrementOrderItem(activeTableId, menuItemId);
    },
    [activeTableId, incrementOrderItem],
  );

  const handleDecreaseItem = useCallback(
    (menuItemId: string) => {
      if (!activeTableId) {
        return;
      }

      decrementOrderItem(activeTableId, menuItemId);
    },
    [activeTableId, decrementOrderItem],
  );

  const handleSeatChange = useCallback(
    (menuItemId: string, seatNo: number) => {
      if (!activeTableId) {
        return;
      }

      setOrderItemSeat(activeTableId, menuItemId, seatNo);
    },
    [activeTableId, setOrderItemSeat],
  );

  const handleMarkItemGift = useCallback(
    (menuItemId: string, reason: string) => {
      if (!activeTableId) {
        return;
      }

      const result = markOrderItem(activeTableId, menuItemId, 'IKRAM', reason);
      pushToast(result.message, result.ok ? 'success' : 'error');
    },
    [activeTableId, markOrderItem, pushToast],
  );

  const handleRestoreItem = useCallback(
    (menuItemId: string) => {
      if (!activeTableId) {
        return;
      }

      const result = restoreOrderItem(activeTableId, menuItemId);
      pushToast(result.message, result.ok ? 'success' : 'error');
    },
    [activeTableId, pushToast, restoreOrderItem],
  );

  const handleCoverToggle = useCallback(
    (enabled: boolean) => {
      if (!activeTableId) {
        return;
      }

      setTableCover(activeTableId, enabled);
    },
    [activeTableId, setTableCover],
  );

  const handleWaiterChange = useCallback(
    (waiterName: string) => {
      if (!activeTableId) {
        return;
      }

      setTableWaiter(activeTableId, waiterName);
    },
    [activeTableId, setTableWaiter],
  );

  const handleGuestCountChange = useCallback(
    (nextGuestCount: number) => {
      if (!activeTableId) {
        return;
      }

      setTableGuestCount(activeTableId, nextGuestCount);
    },
    [activeTableId, setTableGuestCount],
  );

  const handleConfirmConfiguredProduct = useCallback(
    ({
      portionMultiplier,
      seatNo,
      modifiers,
      note,
    }: {
      portionMultiplier: PortionMultiplier;
      seatNo?: number;
      modifiers: { id: string; name: string; price: number }[];
      note?: string;
    }) => {
      if (!configuredItem || !activeTableId) {
        return;
      }

      addConfiguredProductToTable(activeTableId, configuredItem, {
        portionMultiplier,
        seatNo,
        modifiers,
        note,
      });
      pushToast(`${configuredItem.name} seçenekleriyle adisyona eklendi.`, 'success');
    },
    [activeTableId, addConfiguredProductToTable, configuredItem, pushToast],
  );

  if (!table) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-slate-900">Adisyon bulunamadı.</p>
      </section>
    );
  }

  return (
    <div className="space-y-3 pb-24">
      <section className="sticky top-0 z-20 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <AppButton variant="ghost" size="sm" onClick={navigateTables}>
            <ArrowLeft size={14} /> Masalar
          </AppButton>
          <p className="text-sm font-semibold text-slate-900">Masa {table.number}</p>
          <AppButton size="sm" onClick={navigatePayment}>
            POS <ArrowRight size={14} />
          </AppButton>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <AppButton variant={activePanel === 'urunler' ? 'primary' : 'ghost'} size="sm" onClick={() => setActivePanel('urunler')}>
            Ürünler
          </AppButton>
          <AppButton variant={activePanel === 'adisyon' ? 'primary' : 'ghost'} size="sm" onClick={() => setActivePanel('adisyon')}>
            Adisyon
          </AppButton>
        </div>

        <div className="mt-2 grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-center">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">Kişi</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{table.guestCount}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">Durum</p>
            <p className="mt-1 text-xs font-semibold text-slate-900">{table.status.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-slate-500">Toplam</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(totals.grandTotal)}</p>
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Servis</span>
          <ServiceStatusBadge value={serviceStatus} />
        </div>
      </section>

      {activePanel === 'urunler' ? (
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="grid gap-3">
            <QuickPickSection
              title="Favoriler"
              icon={<Star size={14} />}
              items={favoriteQuickItems}
              emptyMessage="Sık sattığın ürünleri yıldızlayınca burada görünür."
              onPick={handleAddProduct}
            />

            <QuickPickSection
              title="Son Seçilenler"
              icon={<History size={14} />}
              items={recentQuickItems}
              emptyMessage="Burada son eklediğin ürünler görünecek."
              onPick={handleAddProduct}
            />

            <QuickPickSection
              title="Hızlı Gidenler"
              icon={<Flame size={14} />}
              items={popularQuickItems}
              emptyMessage="Sipariş geldikçe burada öne çıkan ürünler oluşur."
              onPick={handleAddProduct}
            />
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Ara..."
              className="w-full border-none bg-transparent text-sm text-slate-800 outline-none"
            />
          </label>

          <CategoryFilter
            categories={orderedCategories}
            selected={selectedCategory}
            onSelect={setSelectedCategory}
            layout="compact"
          />

          {filteredMenuItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-slate-700">Ürün bulunamadı.</p>
              <p className="mt-1 text-xs text-slate-500">Arama veya kategori filtresini değiştirin.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {filteredMenuItems.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onAdd={handleAddProduct}
                  onConfigure={handleConfigureItem}
                  isFavorite={favoriteMenuItemIds.includes(item.id)}
                  onToggleFavorite={toggleFavoriteMenuItem}
                  layout="compact"
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="max-h-[calc(100dvh-220px)] overflow-y-auto">
          <OrderSummary
            table={table}
            onIncrease={handleIncreaseItem}
            onDecrease={handleDecreaseItem}
            onSeatChange={handleSeatChange}
            onMarkItemGift={handleMarkItemGift}
            onRestoreItem={handleRestoreItem}
            onCoverToggle={handleCoverToggle}
            onWaiterChange={handleWaiterChange}
            waiterOptions={waiterOptions}
            onGuestCountChange={handleGuestCountChange}
            serviceStatus={serviceStatus}
            onServiceStatusChange={(nextStatus) => setTableServiceStatus(activeTableId, nextStatus)}
            onProceedPayment={navigatePayment}
          />
        </div>
      )}

      <div className="fixed bottom-20 left-3 right-3 z-30 rounded-2xl border border-slate-200 bg-white/95 p-2.5 shadow-xl backdrop-blur lg:hidden">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span>{activePanel === 'urunler' ? 'Açık Adisyon' : 'Toplam Tutar'}</span>
          <strong className="text-sm text-slate-900">{formatCurrency(totals.grandTotal)}</strong>
        </div>
        <AppButton
          className="w-full"
          onClick={() => {
            if (activePanel === 'urunler') {
              setActivePanel('adisyon');
              return;
            }

            navigate(appRoutes.odeme(table.id));
          }}
          disabled={activePanel === 'adisyon' && table.orderItems.length === 0}
        >
          {activePanel === 'urunler' ? 'Adisyonu Gör' : 'Direkt Ödeme Al'}
        </AppButton>
      </div>

      <AddToOrderModal
        item={configuredItem}
        guestCount={Math.max(1, table.guestCount)}
        onClose={() => setConfiguredItem(null)}
        onConfirm={handleConfirmConfiguredProduct}
      />
    </div>
  );
};
