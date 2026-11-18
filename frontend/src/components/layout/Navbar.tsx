import { LogOut, Menu } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';
import Badge from '../common/Badge';
import Button from '../common/Button';

const PAGE_TITLES: Record<string, string> = {
  [ROUTES.dashboard]: 'Dashboard',
  [ROUTES.products]: 'Products',
  [ROUTES.productNew]: 'Add Product',
  [ROUTES.brands]: 'Brands',
  [ROUTES.categories]: 'Categories',
  [ROUTES.stockIn]: 'Stock In',
  [ROUTES.sales]: 'Sales',
  [ROUTES.history]: 'Stock History',
  [ROUTES.lowStock]: 'Low Stock',
  [ROUTES.reports]: 'Reports',
  [ROUTES.staff]: 'Staff Management',
  [ROUTES.profile]: 'My Profile',
  [ROUTES.settings]: 'Settings',
};

function getPageTitle(pathname: string): string {
  if (/^\/products\/\d+\/edit$/.test(pathname)) return 'Edit Product';
  return PAGE_TITLES[pathname] ?? 'Laptop Store';
}

interface NavbarProps {
  onMenuClick: () => void;
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate(ROUTES.login);
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-lg font-semibold text-slate-900">{getPageTitle(pathname)}</span>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <>
            <Link
              to={ROUTES.profile}
              className="hidden text-sm font-medium text-slate-700 hover:text-blue-600 sm:block"
            >
              {user.full_name}
            </Link>
            <Badge color={user.role === 'admin' ? 'blue' : 'slate'}>
              {user.role === 'admin' ? 'Admin' : 'Staff'}
            </Badge>
          </>
        )}
        <Button variant="ghost" icon={<LogOut className="h-4 w-4" />} onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
