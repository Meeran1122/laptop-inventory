import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Laptop, PackageMinus, PackagePlus, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';

import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../hooks/useAuth';
import { getDashboardSummary } from '../services/dashboardService';
import type { DashboardSummary } from '../types/dashboard';
import { ROUTES } from '../utils/constants';
import { getErrorMessage } from '../utils/errors';
import { formatCurrency, formatDate } from '../utils/formatters';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'amber';
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  const colorClass = color === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600';
  return (
    <Card className="!p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className={`rounded-lg p-2 ${colorClass}`}>{icon}</div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDashboardSummary()
      .then(setData)
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (!data) return null;

  const { cards, recent_activities, low_stock_products, recent_sales } = data;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome back, {user?.full_name?.split(' ')[0] ?? 'Admin'}!
          </h1>
          <p className="text-sm text-slate-600">{formatDate(new Date().toISOString())}</p>
        </div>
        <div className="flex gap-2">
          <Link to={ROUTES.stockIn}>
            <Button><PackagePlus className="h-4 w-4" /> Stock In</Button>
          </Link>
          <Link to={ROUTES.sales}>
            <Button variant="secondary"><ShoppingCart className="h-4 w-4" /> New Sale</Button>
          </Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Products" value={cards.total_products} icon={<Laptop className="h-5 w-5" />} color="blue" />
        <StatCard label="Available Stock" value={cards.total_available_stock} icon={<PackagePlus className="h-5 w-5" />} color="blue" />
        <StatCard label="Low Stock" value={cards.low_stock_products} icon={<AlertTriangle className="h-5 w-5" />} color="amber" />
        <StatCard label="Stock-In Logs" value={cards.stock_in_records} icon={<PackagePlus className="h-5 w-5" />} color="blue" />
        <StatCard label="Stock-Out Logs" value={cards.stock_out_records} icon={<PackageMinus className="h-5 w-5" />} color="blue" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent activities (2 cols) */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Stock Activities</h2>
            <Link to={ROUTES.history} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recent_activities.length === 0 ? (
            <EmptyState message="No stock activity yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Laptop</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Qty</th>
                    <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recent_activities.map((item) => (
                    <tr key={`${item.type}-${item.record_id}`} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-sm text-slate-600">{formatDate(item.date)}</td>
                      <td className="px-3 py-2">
                        <Badge color={item.type === 'stock_in' ? 'green' : 'blue'}>
                          {item.type === 'stock_in' ? 'Stock In' : 'Sale'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-900">{item.product_name}</td>
                      <td className={`px-3 py-2 text-sm font-semibold ${item.type === 'stock_in' ? 'text-green-600' : 'text-blue-600'}`}>
                        {item.type === 'stock_in' ? '+' : '−'}{item.quantity}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-600">{item.performed_by_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Low Stock Alerts */}
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Low Stock Alerts</h2>
            <span className="text-xs text-slate-500">{low_stock_products.length} item(s)</span>
          </div>
          {low_stock_products.length === 0 ? (
            <EmptyState message="Everything is well stocked." />
          ) : (
            <div className="space-y-3">
              {low_stock_products.map((item) => (
                <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">Available: {item.quantity} / Min: {item.min_stock_level}</p>
                    </div>
                    <Badge color={item.status === 'out_of_stock' ? 'red' : 'amber'}>
                      {item.status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                    </Badge>
                  </div>
                </div>
              ))}
              <Link to={ROUTES.lowStock} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recent Sales</h2>
          <Link to={ROUTES.sales} className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {recent_sales.length === 0 ? (
          <EmptyState message="No sales yet." />
        ) : (
          <div className="divide-y divide-slate-200">
            {recent_sales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{sale.product_name}</p>
                  <p className="text-xs text-slate-500">
                    Qty: {sale.quantity} · {formatDate(sale.sale_date)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-blue-600">{formatCurrency(sale.total_amount)}</p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}