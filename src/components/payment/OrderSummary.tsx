import { memo, useMemo } from 'react';
import { Minus, Plus } from 'lucide-react';

import type { OrderAuditLog, OrderItemStatus, ServiceStatus, Table } from '../../types/pos';
import { formatCurrency } from '../../utils/currency';
import { formatDateTime } from '../../utils/date';
import { SERVICE_STATUS_LABELS } from '../../utils/labels';
import { calculateTotals } from '../../utils/order';
import { AppButton } from '../ui/AppButton';
import { ServiceStatusBadge } from '../ui/ServiceStatusBadge';

interface OrderSummaryProps {
  table: Table;
  onIncrease: (menuItemId: string) => void;
  onDecrease: (menuItemId: string) => void;
  onSeatChange: (menuItemId: string, seatNo: number) => void;
  onMarkItemGift: (menuItemId: string, reason: string) => void;
  onRestoreItem: (menuItemId: string) => void;
  onCoverToggle: (enabled: boolean) => void;
  onWaiterChange: (waiterName: string) => void;
  waiterOptions: string[];
  onGuestCountChange: (nextGuestCount: number) => void;
  serviceStatus: ServiceStatus;
  onServiceStatusChange: (nextStatus: ServiceStatus) => void;
  onProceedPayment: () => void;
}

const statusClassMap: Record<OrderItemStatus, string> = {
  AKTIF: 'border-slate-100 bg-slate-50',
  IPTAL: 'border-rose-200 bg-rose-50',
  IKRAM: 'border-amber-200 bg-amber-50',
};

const statusLabelMap: Record<OrderItemStatus, string> = {
  AKTIF: 'Aktif',
  IPTAL: 'İptal',
  IKRAM: 'İkram',
};

const renderAuditMessage = (log: OrderAuditLog) => `${formatDateTime(log.createdAt)} • ${log.message}`;

export const OrderSummary = memo(({
  table,
  onIncrease,
  onDecrease,
  onSeatChange,
  onMarkItemGift,
  onRestoreItem,
  onCoverToggle,
  onWaiterChange,
  waiterOptions,
  onGuestCountChange,
  serviceStatus,
  onServiceStatusChange,
  onProceedPayment,
}: OrderSummaryProps) => {
  const totals = useMemo(
    () =>
      calculateTotals(table.orderItems, {
        guestCount: table.guestCount,
        coverEnabled: table.coverEnabled,
        coverPerGuest: table.coverPerGuest,
      }),
    [table.coverEnabled, table.coverPerGuest, table.guestCount, table.orderItems],
  );
  const auditLogs = useMemo(() => (table.auditLogs ?? []).slice(-6).reverse(), [table.auditLogs]);
  const seatOptions = useMemo(
    () => Array.from({ length: Math.max(1, table.guestCount) }, (_, index) => index + 1),
    [table.guestCount],
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Adisyon Detayı</h2>

        <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
          <button
            type="button"
            onClick={() => onGuestCountChange(Math.max(0, table.guestCount - 1))}
            className="rounded-md p-1 text-slate-700 transition hover:bg-white"
            aria-label="Kişi sayısını azalt"
          >
            <Minus size={14} />
          </button>
          <span className="min-w-14 text-center text-sm font-medium text-slate-800">{table.guestCount} Kişi</span>
          <button
            type="button"
            onClick={() => onGuestCountChange(table.guestCount + 1)}
            className="rounded-md p-1 text-slate-700 transition hover:bg-white"
            aria-label="Kişi sayısını artır"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <section className="mb-4 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:grid-cols-2">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={table.coverEnabled ?? false}
            onChange={(event) => onCoverToggle(event.target.checked)}
            className="h-4 w-4 accent-[#D7AD2E]"
          />
          Kuver Uygula ({formatCurrency(table.coverPerGuest ?? 35)} / kişi)
        </label>

        <label className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Hesabı Alan Garson</span>
          <select
            value={table.waiterName ?? ''}
            onChange={(event) => onWaiterChange(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800 outline-none focus:border-[#E9C44A]"
          >
            <option value="">Seçiniz</option>
            {waiterOptions.map((waiterName) => (
              <option key={waiterName} value={waiterName}>
                {waiterName}
              </option>
            ))}
          </select>
        </label>
      </section>

      {table.orderItems.length > 0 ? (
        <section className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Servis Aşaması</span>
            <ServiceStatusBadge value={serviceStatus} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(['BEKLIYOR', 'MUTFAKTA', 'HAZIR', 'SERVISTE'] as ServiceStatus[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onServiceStatusChange(option)}
                className={`rounded-xl border px-2 py-2 text-xs font-semibold transition ${
                  serviceStatus === option
                    ? 'border-[#D7AD2E] bg-[#FFF3CC] text-[#6E5408]'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                {SERVICE_STATUS_LABELS[option]}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div className="space-y-2">
        {table.orderItems.length > 0 ? (
          table.orderItems.map((item) => {
            const itemStatus = item.itemStatus ?? 'AKTIF';
            const isActive = itemStatus === 'AKTIF';

            return (
              <div key={item.menuItemId} className={`rounded-xl border p-2 ${statusClassMap[itemStatus]}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-slate-900 sm:text-sm">
                      {item.name}
                      {itemStatus !== 'AKTIF' ? (
                        <span className="ml-2 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600">
                          {statusLabelMap[itemStatus]}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[11px] text-slate-500 sm:text-xs">
                      {formatCurrency(item.price)} x {item.quantity}
                      {item.portionMultiplier && item.portionMultiplier !== 1 ? ` • ${item.portionMultiplier} Porsiyon` : ''}
                      {item.seatNo ? ` • Kişi ${item.seatNo}` : ''}
                    </p>
                    {item.modifiers && item.modifiers.length > 0 ? (
                      <p className="mt-1 text-[10px] text-slate-600 sm:text-[11px]">Modifier: {item.modifiers.map((modifier) => modifier.name).join(', ')}</p>
                    ) : null}
                    {item.note ? <p className="mt-1 text-[10px] text-slate-600 sm:text-[11px]">Not: {item.note}</p> : null}
                    {item.voidReason ? <p className="mt-1 text-[10px] font-medium text-slate-700 sm:text-[11px]">Neden: {item.voidReason}</p> : null}
                  </div>

                  <div className="text-right">
                    <p className="text-[13px] font-semibold text-slate-900 sm:text-sm">
                      {isActive ? formatCurrency(item.price * item.quantity) : formatCurrency(0)}
                    </p>

                    {isActive ? (
                      <div className="mt-1 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1">
                        <button
                          type="button"
                          onClick={() => onDecrease(item.menuItemId)}
                          className="rounded p-0.5 text-slate-700 transition hover:bg-slate-100"
                          aria-label="Adet azalt"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="min-w-5 text-center text-xs font-semibold text-slate-800">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onIncrease(item.menuItemId)}
                          className="rounded p-0.5 text-slate-700 transition hover:bg-slate-100"
                          aria-label="Adet artır"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ) : (
                      <AppButton size="sm" variant="ghost" className="mt-1" onClick={() => onRestoreItem(item.menuItemId)}>
                        Geri Al
                      </AppButton>
                    )}
                  </div>
                </div>

                {isActive ? (
                  <div className="mt-2 grid gap-2 sm:grid-cols-[140px_1fr]">
                    <select
                      value={item.seatNo ?? 1}
                      onChange={(event) => onSeatChange(item.menuItemId, Number(event.target.value))}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] text-slate-700 outline-none focus:border-[#E9C44A] sm:text-xs"
                    >
                      {seatOptions.map((seatNo) => (
                        <option key={seatNo} value={seatNo}>
                          Kişi {seatNo}
                        </option>
                      ))}
                    </select>

                    <div className="grid grid-cols-2 gap-2">
                      <AppButton
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          const reason = window.prompt('İkram nedeni girin');
                          if (!reason) {
                            return;
                          }
                          onMarkItemGift(item.menuItemId, reason);
                        }}
                      >
                        İkram
                      </AppButton>

                      <div />
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center">
            <p className="text-sm font-medium text-slate-600">Adisyon henüz boş</p>
            <p className="mt-1 text-xs text-slate-500">Ürün seçildiğinde listeye otomatik eklenecek.</p>
          </div>
        )}
      </div>

      {auditLogs.length > 0 ? (
        <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Satır Logları ({auditLogs.length})
          </summary>
          <div className="mt-2 space-y-1">
            {auditLogs.map((log) => (
              <p key={log.id} className="text-[10px] text-slate-600 sm:text-[11px]">
                {renderAuditMessage(log)}
              </p>
            ))}
          </div>
        </details>
      ) : null}

      <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
        <div className="flex items-center justify-between text-slate-600">
          <span>Ara Toplam</span>
          <strong className="text-slate-900">{formatCurrency(totals.subtotal)}</strong>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <span>Hizmet Bedeli (%5)</span>
          <strong className="text-slate-900">{formatCurrency(totals.serviceFee)}</strong>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <span>Kuver</span>
          <strong className="text-slate-900">{formatCurrency(totals.coverCharge)}</strong>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
          <span>Toplam Tutar</span>
          <span>{formatCurrency(totals.grandTotal)}</span>
        </div>
      </div>

      <AppButton className="mt-4 w-full" onClick={onProceedPayment} disabled={totals.grandTotal <= 0}>
        Ödemeye Geç
      </AppButton>
    </section>
  );
});

OrderSummary.displayName = 'OrderSummary';
