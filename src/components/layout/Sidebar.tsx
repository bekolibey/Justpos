import { ArrowLeftRight, BarChart3, CreditCard, History, LayoutGrid, LogOut, PackagePlus, ReceiptText, Settings } from 'lucide-react';
import { useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

import { appRoutes } from '../../constants/routes';
import { usePOS } from '../../state/POSContext';

const navItems = [
  { to: appRoutes.tables, label: 'Masalar', icon: LayoutGrid },
  { to: appRoutes.productManagement, label: 'Ürün Ekle', icon: PackagePlus },
  { to: appRoutes.tableOperations, label: 'Masa Operasyonları', icon: ArrowLeftRight },
  { to: appRoutes.history, label: 'İşlem Geçmişi', icon: History },
  { to: appRoutes.reports, label: 'Raporlar', icon: BarChart3 },
  { to: appRoutes.settings, label: 'Ayarlar', icon: Settings },
];

export const Sidebar = () => {
  const navigate = useNavigate();
  const { logout, tables } = usePOS();
  const paymentTableId = useMemo(
    () =>
      tables.find((table) => table.status === 'ODEME_BEKLIYOR')?.id ??
      tables.find((table) => table.orderItems.length > 0)?.id ??
      tables[0]?.id ??
      'table-1',
    [tables],
  );

  return (
    <aside className="flex h-screen w-full flex-col border-r border-slate-200/40 bg-[linear-gradient(180deg,#1E222B_0%,#171A20_100%)] px-4 py-5 text-slate-200">
      <button
        type="button"
        onClick={() => navigate(appRoutes.tables)}
        className="mb-8 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left shadow-lg shadow-black/20 transition hover:border-[#E9C44A]/60 hover:bg-white/10"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#E9C44A]">Restoran POS Pro</p>
        <p className="mt-1 text-sm font-semibold">Adisyon ve POS Yönetimi</p>
      </button>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[#E9C44A] text-[#1F2229] shadow-sm'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <NavLink
          to={appRoutes.odeme(paymentTableId)}
          className={({ isActive }) =>
            `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              isActive ? 'bg-[#E9C44A] text-[#1F2229]' : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`
          }
        >
          <CreditCard size={16} />
          <span>Ödemeler</span>
        </NavLink>

        <NavLink
          to={appRoutes.tables}
          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          <ReceiptText size={16} />
          <span>Siparişler</span>
        </NavLink>
      </nav>

      <button
        type="button"
        onClick={() => {
          logout();
          navigate(appRoutes.login, { replace: true });
        }}
        className="mt-auto flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-slate-200 transition hover:border-rose-300/40 hover:bg-rose-200/10"
      >
        <LogOut size={16} />
        Çıkış Yap
      </button>
    </aside>
  );
};
