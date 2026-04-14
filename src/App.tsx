import { Suspense, lazy } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import { MainLayout } from './components/layout/MainLayout';
import { appRoutes } from './constants/routes';
import { usePOS } from './state/POSContext';

const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })));
const TablesPage = lazy(() => import('./pages/TablesPage').then((module) => ({ default: module.TablesPage })));
const AdisyonPage = lazy(() => import('./pages/AdisyonPage').then((module) => ({ default: module.AdisyonPage })));
const PaymentPage = lazy(() => import('./pages/PaymentPage').then((module) => ({ default: module.PaymentPage })));
const TransactionHistoryPage = lazy(() =>
  import('./pages/TransactionHistoryPage').then((module) => ({ default: module.TransactionHistoryPage })),
);
const TableOperationsPage = lazy(() =>
  import('./pages/TableOperationsPage').then((module) => ({ default: module.TableOperationsPage })),
);
const ProductManagementPage = lazy(() =>
  import('./pages/ProductManagementPage').then((module) => ({ default: module.ProductManagementPage })),
);
const ReportsPage = lazy(() => import('./pages/ReportsPage').then((module) => ({ default: module.ReportsPage })));
const RestaurantSettingsPage = lazy(() =>
  import('./pages/RestaurantSettingsPage').then((module) => ({ default: module.RestaurantSettingsPage })),
);

const RouteFallback = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm font-medium text-slate-600">Ekran yükleniyor...</p>
  </div>
);

const RootRedirect = () => {
  const { user } = usePOS();

  return <Navigate to={user ? appRoutes.tables : appRoutes.login} replace />;
};

const ProtectedRoutes = () => {
  const { user } = usePOS();

  if (!user) {
    return <Navigate to={appRoutes.login} replace />;
  }

  return <Outlet />;
};

export const App = () => (
  <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path={appRoutes.root} element={<RootRedirect />} />
      <Route path={appRoutes.login} element={<LoginPage />} />

      <Route element={<ProtectedRoutes />}>
        <Route element={<MainLayout />}>
          <Route path={appRoutes.tables} element={<TablesPage />} />
          <Route path={appRoutes.adisyonPattern} element={<AdisyonPage />} />
          <Route path={appRoutes.odemePattern} element={<PaymentPage />} />
          <Route path={appRoutes.history} element={<TransactionHistoryPage />} />
          <Route path={appRoutes.tableOperations} element={<TableOperationsPage />} />
          <Route path={appRoutes.productManagement} element={<ProductManagementPage />} />
          <Route path={appRoutes.reports} element={<ReportsPage />} />
          <Route path={appRoutes.settings} element={<RestaurantSettingsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  </Suspense>
);
