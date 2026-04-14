import { Bell, CalendarDays, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { appRoutes } from '../../constants/routes';
import { usePOS } from '../../state/POSContext';

const routeMeta: Array<{ startsWith: string; title: string; subtitle: string }> = [
  { startsWith: appRoutes.tables, title: 'Masalar', subtitle: 'Salon genel durumu ve açık adisyonlar' },
  { startsWith: '/adisyon', title: 'Adisyon Detayı', subtitle: 'Masa siparişleri ve ürün yönetimi' },
  { startsWith: '/odeme', title: 'Ödemeler', subtitle: 'POS yönlendirme ve tahsilat operasyonu' },
  { startsWith: appRoutes.productManagement, title: 'Ürün Yönetimi', subtitle: 'Menüye yeni ürün ekleme ve liste yönetimi' },
  { startsWith: appRoutes.tableOperations, title: 'Masa Operasyonları', subtitle: 'Masa birleştir, taşı ve ayır akışları' },
  { startsWith: appRoutes.history, title: 'İşlem Geçmişi', subtitle: 'Tüm ödeme işlemleri ve detayları' },
  { startsWith: appRoutes.reports, title: 'Raporlar', subtitle: 'Günlük performans ve terminal dağılımı' },
  { startsWith: appRoutes.settings, title: 'Ayarlar', subtitle: 'İş yeri ve sistem yapılandırmaları' },
];

export const Header = () => {
  const location = useLocation();
  const { user, tables } = usePOS();

  const page = routeMeta.find((entry) => location.pathname.startsWith(entry.startsWith)) ?? {
    title: 'Masalar',
    subtitle: 'Operasyon paneli',
  };

  const liveSummary = useMemo(
    () => ({
      active: tables.filter((table) => table.status === 'DOLU').length,
      waiting: tables.filter((table) => table.status === 'ODEME_BEKLIYOR').length,
    }),
    [tables],
  );

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-[#F6F7FA]/95 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 pb-4 pt-[calc(1rem+var(--safe-area-top))] lg:px-6 lg:py-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-500">
            <Link className="transition hover:text-slate-700" to={appRoutes.tables}>
              Operasyon
            </Link>
            <ChevronRight size={14} />
            <span>{page.title}</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">{page.title}</h1>
          <p className="text-sm text-slate-500">{page.subtitle}</p>
          <div className="mt-2 hidden items-center gap-2 sm:flex">
            <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600">
              Dolu Masa: <strong className="text-slate-900">{liveSummary.active}</strong>
            </span>
            <span className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
              Ödeme Bekliyor: <strong>{liveSummary.waiting}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-right shadow-sm sm:block">
            <p className="text-xs text-slate-500">İş Yeri</p>
            <p className="text-sm font-semibold text-slate-800">{user?.workplace ?? '-'}</p>
          </div>

          <div className="hidden rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm md:block">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <CalendarDays size={14} />
              <span>{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' }).format(new Date())}</span>
            </div>
            <p className="text-sm font-semibold text-slate-800">{user?.fullName ?? 'Yetkili'}</p>
          </div>

          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:bg-slate-50"
            aria-label="Bildirimler"
          >
            <Bell size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
