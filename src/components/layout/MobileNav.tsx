import { BarChart3, CreditCard, History, LayoutGrid, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { appRoutes } from '../../constants/routes';
import { usePOS } from '../../state/POSContext';

export const MobileNav = () => {
  const { tables } = usePOS();
  const paymentTableId = tables.find((table) => table.orderItems.length > 0)?.id ?? tables[0]?.id ?? 'table-1';

  const items = [
    { to: appRoutes.tables, label: 'Masalar', icon: LayoutGrid },
    { to: appRoutes.odeme(paymentTableId), label: 'Ödemeler', icon: CreditCard },
    { to: appRoutes.history, label: 'Geçmiş', icon: History },
    { to: appRoutes.reports, label: 'Raporlar', icon: BarChart3 },
    { to: appRoutes.settings, label: 'Ayarlar', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-[calc(0.75rem+var(--safe-area-bottom))] left-1/2 z-30 flex w-[calc(100%-1rem)] -translate-x-1/2 items-center justify-between rounded-2xl border border-slate-200 bg-white/95 px-2 py-1.5 shadow-lg backdrop-blur lg:hidden">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition ${
                isActive ? 'bg-[#FFF5CF] text-[#7A5B00]' : 'text-slate-500'
              }`
            }
          >
            <Icon size={17} />
            <span className="truncate">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
