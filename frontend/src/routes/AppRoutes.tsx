import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
// import Card from '../components/common/Card';
// import EmptyState from '../components/common/EmptyState';
// import PageHeader from '../components/common/PageHeader';
import MainLayout from '../components/layout/MainLayout';
import Dashboard from '../pages/Dashboard';
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
import Profile from '../pages/Profile';
import Settings from '../pages/Settings';
import StaffManagement from '../pages/StaffManagement';
import { ROUTES } from '../utils/constants';
import ProtectedRoute from './ProtectedRoute';
import Brands from '../pages/Brands';
import Categories from '../pages/Categories';
import Products from '../pages/Products';
import ProductForm from '../pages/ProductForm';
import StockIn from '../pages/StockIn';
import Sales from '../pages/Sales';
import History from '../pages/History';
import LowStock from '../pages/LowStock';
import Reports from '../pages/Reports';

// // Temporary placeholder. Each step replaces its placeholder with the real page.
// function ComingSoon({ title }: { title: string }) {
//   return (
//     <>
//       <PageHeader title={title} />
//       <Card>
//         <EmptyState message={`${title} will be built in an upcoming step.`} />
//       </Card>
//     </>
//   );
// }

function adminOnly(page: ReactNode) {
  return <ProtectedRoute allowedRoles={['admin']}>{page}</ProtectedRoute>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<Login />} />
      <Route path="/" element={<Navigate to={ROUTES.dashboard} replace />} />
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path={ROUTES.dashboard} element={<Dashboard />} />
        <Route path={ROUTES.products} element={<Products />} />
        <Route path={ROUTES.productNew} element={adminOnly(<ProductForm />)} />
        <Route path="/products/:id/edit" element={adminOnly(<ProductForm />)} />
        <Route path={ROUTES.brands} element={adminOnly(<Brands />)} />
        <Route path={ROUTES.categories} element={adminOnly(<Categories />)} />
        <Route path={ROUTES.stockIn} element={<StockIn />} />
        <Route path={ROUTES.sales} element={<Sales />} />
        <Route path={ROUTES.history} element={<History />} />
        <Route path={ROUTES.lowStock} element={<LowStock />} />
        <Route path={ROUTES.reports} element={adminOnly(<Reports />)} />
        <Route path={ROUTES.staff} element={adminOnly(<StaffManagement />)} />
        <Route path={ROUTES.profile} element={<Profile />} />
        <Route path={ROUTES.settings} element={adminOnly(<Settings />)} />
        <Route path={ROUTES.products} element={<Products />} />
        <Route path={ROUTES.productNew} element={adminOnly(<ProductForm />)} />
        <Route path="/products/:id/edit" element={adminOnly(<ProductForm />)} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}