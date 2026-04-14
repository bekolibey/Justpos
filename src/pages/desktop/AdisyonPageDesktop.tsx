import { ArrowRight, Search } from 'lucide-react';
import { useCallback, useDeferredValue, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { CategoryFilter } from '../../components/menu/CategoryFilter';
import { AddToOrderModal } from '../../components/menu/AddToOrderModal';
import { ProductCard } from '../../components/menu/ProductCard';
import { OrderSummary } from '../../components/payment/OrderSummary';
import { AppButton } from '../../components/ui/AppButton';
import { ServiceStatusBadge } from '../../components/ui/ServiceStatusBadge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { appRoutes } from '../../constants/routes';
import { MENU_CATEGORIES } from '../../data/menu';
import type { MenuCategory, MenuItem, PortionMultiplier } from '../../types/pos';
import { usePOS } from '../../state/POSContext';
import { formatElapsed } from '../../utils/date';

export const AdisyonPageDesktop = () => {
  const navigate = useNavigate();
  const { tableId } = useParams<{ tableId: string }>();
  const {
    tables,
    menuItems,
    favoriteMenuItemIds,
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
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | 'Tümü'>('Tümü');
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

  const waiterOptions = useMemo(() => [...waiters], [waiters]);
  const serviceStatus = tableServiceStatusById[activeTableId] ?? 'BEKLIYOR';
  const handleConfigureItem = useCallback((selectedItem: MenuItem) => setConfiguredItem(selectedItem), []);

  const handleNavigatePayment = useCallback(() => {
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
        `${selectedItem.name}${portionMultiplier === 1 ? '' : ` (${portionMultiplier} Porsiyon)`} adisyona eklendi.`,
        'success',
      );
    },
    [activeTableId, addProductToTable, pushToast],
  );

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
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Adisyon bulunamadı</h2>
        <p className="mt-1 text-sm text-slate-500">Masa kaydı sistemde görünmüyor.</p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Adisyon Detayı - Masa {table.number}</h2>
          <p className="text-sm text-slate-500">Durum: <StatusBadge variant="table" value={table.status} /></p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Kişi: {table.guestCount}</span>
            <span>•</span>
            <span>Süre: {table.openedAt ? formatElapsed(table.openedAt) : '--:--'}</span>
            {table.orderItems.length > 0 ? (
              <>
                <span>•</span>
                <ServiceStatusBadge value={serviceStatus} />
              </>
            ) : null}
          </div>
        </div>

        <AppButton onClick={handleNavigatePayment} className="inline-flex items-center gap-2">
          POS’a Git <ArrowRight size={16} />
        </AppButton>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-slate-900">Ürünler</h3>

            <label className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2">
              <Search size={16} className="text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Ara..."
                className="w-full border-none bg-transparent text-sm text-slate-800 outline-none"
              />
            </label>

            <CategoryFilter categories={MENU_CATEGORIES} selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>

          {filteredMenuItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center">
              <p className="text-sm font-semibold text-slate-700">Aramaya uygun ürün bulunamadı.</p>
              <p className="mt-1 text-xs text-slate-500">Kategori veya arama filtresini değiştirin.</p>
            </div>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {filteredMenuItems.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  onAdd={handleAddProduct}
                  onConfigure={handleConfigureItem}
                  isFavorite={favoriteMenuItemIds.includes(item.id)}
                  onToggleFavorite={toggleFavoriteMenuItem}
                />
              ))}
            </div>
          )}
        </div>

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
          onProceedPayment={handleNavigatePayment}
        />
      </section>

      <AddToOrderModal
        item={configuredItem}
        guestCount={Math.max(1, table.guestCount)}
        onClose={() => setConfiguredItem(null)}
        onConfirm={handleConfirmConfiguredProduct}
      />
    </div>
  );
};
