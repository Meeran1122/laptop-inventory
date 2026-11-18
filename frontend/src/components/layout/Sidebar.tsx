import {
  AlertTriangle,
  BarChart3,
  History,
  Laptop,
  Layers,
  LayoutDashboard,
  PackagePlus,
  Settings,
  ShoppingCart,
  Tag,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../utils/constants';

interface MenuItem {
  label: string;
  path: string;
  icon: LucideIcon;
  adminOnly?: boolean;
  staffOnly?: boolean;
}

const MENU_ITEMS: MenuItem[] = [
  { label: 'Dashboard', path: ROUTES.dashboard, icon: LayoutDashboard },
  { label: 'Products', path: ROUTES.products, icon: Laptop },
  { label: 'Brands', path: ROUTES.brands, icon: Tag, adminOnly: true },
  { label: 'Categories', path: ROUTES.categories, icon: Layers, adminOnly: true },
  { label: 'Stock In', path: ROUTES.stockIn, icon: PackagePlus },
  { label: 'Sales', path: ROUTES.sales, icon: ShoppingCart },
  { label: 'Stock History', path: ROUTES.history, icon: History },
  { label: 'Low Stock', path: ROUTES.lowStock, icon: AlertTriangle },
  { label: 'Reports', path: ROUTES.reports, icon: BarChart3, adminOnly: true },
  { label: 'Staff Management', path: ROUTES.staff, icon: Users, adminOnly: true },
  { label: 'Settings', path: ROUTES.settings, icon: Settings, adminOnly: true },
  { label: 'My Profile', path: ROUTES.profile, icon: User, staffOnly: true },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { isAdmin } = useAuth();

  const visibleItems = MENU_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.staffOnly) return !isAdmin;
    return true;
  });

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 transform flex-col bg-blue-900 transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center px-6 text-xl font-semibold text-white">Laptop Store</div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {visibleItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium ${
                  isActive ? 'bg-blue-600 text-white' : 'text-blue-100 hover:bg-blue-800'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
