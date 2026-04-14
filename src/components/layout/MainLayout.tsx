import { Outlet } from 'react-router-dom';

import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { RightSummaryPanel } from './RightSummaryPanel';
import { Sidebar } from './Sidebar';
import { ToastViewport } from '../ui/ToastViewport';

export const MainLayout = () => (
  <div className="min-h-screen bg-[radial-gradient(circle_at_8%_8%,#fff4cf_0%,#f7f8fb_35%),radial-gradient(circle_at_92%_0%,#e7f0ff_0%,#f6f8fc_28%),linear-gradient(180deg,#f8f9fc_0%,#f1f4f9_100%)] text-slate-900">
    <div className="mx-auto flex max-w-[1680px]">
      <div className="hidden w-72 lg:block">
        <Sidebar />
      </div>

      <div className="flex min-h-screen flex-1 flex-col">
        <Header />

        <div className="grid flex-1 gap-5 px-4 pb-[calc(5.5rem+var(--safe-area-bottom))] pt-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-6 lg:pb-5">
          <main className="space-y-5 fade-in-up">
            <Outlet />
          </main>

          <div className="hidden lg:block lg:sticky lg:top-24 lg:h-fit">
            <RightSummaryPanel />
          </div>
        </div>
      </div>
    </div>

    <MobileNav />
    <ToastViewport />
  </div>
);
