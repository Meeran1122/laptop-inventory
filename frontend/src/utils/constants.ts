export const TOKEN_STORAGE_KEY = 'lims_token';

export const ROLES = {
  admin: 'admin',
  staff: 'staff',
} as const;

export const ROUTES = {
  login: '/login',
  dashboard: '/dashboard',
  products: '/products',
  productNew: '/products/new',
  brands: '/brands',
  categories: '/categories',
  stockIn: '/stock-in',
  sales: '/sales',
  history: '/history',
  lowStock: '/low-stock',
  reports: '/reports',
  staff: '/staff',
  profile: '/profile',
  settings: '/settings',
} as const;
