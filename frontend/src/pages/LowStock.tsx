import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import Badge from '../components/common/Badge';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/common/PageHeader';
import Spinner from '../components/common/Spinner';
import { getLowStock } from '../services/historyService';
import type { LowStockItem } from '../types/stock';
import { getErrorMessage } from '../utils/errors';

export default function LowStock() {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getLowStock()
      .then((r) => setItems(r.items))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div>
      <PageHeader title="Low Stock" />
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : items.length === 0 ? (
          <EmptyState message="No low-stock products. Everything is well stocked." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Laptop</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Brand</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Model</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Available</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Minimum</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.brand_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.model}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.min_stock_level}</td>
                    <td className="px-4 py-3">
                      <Badge color={item.status === 'out_of_stock' ? 'red' : 'amber'}>
                        {item.status === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}