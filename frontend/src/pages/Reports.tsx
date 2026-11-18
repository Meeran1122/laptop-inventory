import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download, FileText, AlertTriangle, TrendingUp, Package } from 'lucide-react';

import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/common/PageHeader';
import Spinner from '../components/common/Spinner';
import { getCurrentStock, getLowStockReport, getSalesReport, getStockInReport } from '../services/reportService';
import type { CurrentStockReport, LowStockReport, SalesReport, StockInReport } from '../types/report';
import { getErrorMessage } from '../utils/errors';
import { formatCurrency, formatDate, today } from '../utils/formatters';

type Tab = 'current' | 'low' | 'stock-in' | 'sales';

const TABS: { key: Tab; label: string }[] = [
  { key: 'current', label: 'Current Stock' },
  { key: 'low', label: 'Low Stock' },
  { key: 'stock-in', label: 'Stock-In' },
  { key: 'sales', label: 'Sales' },
];

const csvEscape = (v: string | number | null | undefined) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const downloadCsv = (filename: string, rows: (string | number | null | undefined)[][]) => {
  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default function Reports() {
  const [tab, setTab] = useState<Tab>('current');
  const [dateFrom, setDateFrom] = useState(today().slice(0, 8) + '01');
  const [dateTo, setDateTo] = useState(today());
  const [isLoading, setIsLoading] = useState(true);

  const [current, setCurrent] = useState<CurrentStockReport | null>(null);
  const [low, setLow] = useState<LowStockReport | null>(null);
  const [stockIn, setStockIn] = useState<StockInReport | null>(null);
  const [sales, setSales] = useState<SalesReport | null>(null);

  const loadCurrent = async () => {
    setIsLoading(true);
    try {
      setCurrent(await getCurrentStock());
      setLow(await getLowStockReport());
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const loadDated = async () => {
    if (dateFrom > dateTo) {
      toast.error('Start date must be before end date.');
      return;
    }
    setIsLoading(true);
    try {
      if (tab === 'stock-in') setStockIn(await getStockInReport(dateFrom, dateTo));
      if (tab === 'sales') setSales(await getSalesReport(dateFrom, dateTo));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tab === 'current' || tab === 'low') loadCurrent();
    else loadDated();
  }, [tab]);

  const handleExport = () => {
    if (tab === 'current' && current) {
      downloadCsv('current-stock.csv', [
        ['Product', 'Brand', 'Category', 'Model', 'Quantity', 'Min Stock', 'Purchase Price', 'Selling Price'],
        ...current.items.map((i) => [
          i.name, i.brand_name, i.category_name, i.model,
          i.quantity, i.min_stock_level, i.purchase_price, i.selling_price,
        ]),
      ]);
    } else if (tab === 'low' && low) {
      downloadCsv('low-stock.csv', [
        ['Product', 'Brand', 'Model', 'Available', 'Min Stock', 'Status'],
        ...low.items.map((i) => [i.name, i.brand_name, i.model, i.quantity, i.min_stock_level, i.status]),
      ]);
    } else if (tab === 'stock-in' && stockIn) {
      downloadCsv('stock-in.csv', [
        ['Date', 'Laptop', 'Quantity', 'Purchase Price', 'By'],
        ...stockIn.items.map((i) => [i.stock_date, i.product_name, i.quantity, i.purchase_price ?? '', i.created_by_name]),
      ]);
    } else if (tab === 'sales' && sales) {
      downloadCsv('sales.csv', [
        ['Date', 'Laptop', 'Quantity', 'Unit Price', 'Total', 'By'],
        ...sales.items.map((i) => [i.sale_date, i.product_name, i.quantity, i.selling_price, i.total_amount, i.created_by_name]),
      ]);
    }
  };

  const renderCurrent = () => {
    if (!current) return null;
    return (
      <>
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="!p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Unique Products</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{current.total_products}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600"><Package className="h-5 w-5" /></div>
            </div>
          </Card>
          <Card className="!p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Units in Stock</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{current.total_units.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600"><TrendingUp className="h-5 w-5" /></div>
            </div>
          </Card>
          <Card className="!p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Total Inventory Value</p>
                <p className="mt-2 text-3xl font-semibold text-slate-900">{formatCurrency(current.total_inventory_value)}</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-2 text-blue-600"><FileText className="h-5 w-5" /></div>
            </div>
          </Card>
        </div>
        <Card>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Current Inventory Breakdown</h2>
          {current.items.length === 0 ? <EmptyState message="No products yet." /> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Brand</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Unit Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">In Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {current.items.map((item) => {
                    const isOut = item.quantity === 0;
                    const isLow = item.quantity < item.min_stock_level;
                    return (
                      <tr key={item.product_id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.brand_name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.category_name}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(item.selling_price)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-900">{item.quantity}</td>
                        <td className="px-4 py-3">
                          <Badge color={isOut ? 'red' : isLow ? 'amber' : 'green'}>
                            {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </>
    );
  };

  const renderLow = () => {
    if (!low) return null;
    return (
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Low Stock Report</h2>
        {low.items.length === 0 ? <EmptyState message="Everything is well stocked." /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Product</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Brand</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Available</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Min Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {low.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.brand_name}</td>
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
    );
  };

  const renderStockIn = () => {
    if (!stockIn) return null;
    return (
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Stock-In Report ({stockIn.total_records} records · {stockIn.total_units} units)
        </h2>
        {stockIn.items.length === 0 ? <EmptyState message="No stock-in in this range." /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Laptop</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Purchase Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {stockIn.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(item.stock_date)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.product_name}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">+{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.purchase_price ? formatCurrency(item.purchase_price) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.created_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    );
  };

  const renderSales = () => {
    if (!sales) return null;
    return (
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          Sales Report ({sales.total_records} sales · {sales.total_units} units · Total: {formatCurrency(sales.total_sales_amount)})
        </h2>
        {sales.items.length === 0 ? <EmptyState message="No sales in this range." /> : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Laptop</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Unit Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sales.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(item.sale_date)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.product_name}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600">{item.quantity}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(item.selling_price)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatCurrency(item.total_amount)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.created_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleExport}><Download className="h-4 w-4" /> Export CSV</Button>
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === t.key ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {(tab === 'stock-in' || tab === 'sales') && (
        <Card className="mb-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium text-slate-700">To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm" />
            </div>
            <Button onClick={loadDated} isLoading={isLoading}>Apply</Button>
          </div>
        </Card>
      )}

      {isLoading ? <div className="flex justify-center py-12"><Spinner /></div> : (
        <>
          {tab === 'current' && renderCurrent()}
          {tab === 'low' && renderLow()}
          {tab === 'stock-in' && renderStockIn()}
          {tab === 'sales' && renderSales()}
        </>
      )}
    </div>
  );
}