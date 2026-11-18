import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import PageHeader from '../components/common/PageHeader';
import Spinner from '../components/common/Spinner';
import { getAllActiveProducts } from '../services/productService';
import { getHistory } from '../services/historyService';
import type { Product } from '../types/product';
import type { HistoryItem } from '../types/stock';
import { getErrorMessage } from '../utils/errors';
import { formatCurrency, formatDate } from '../utils/formatters';
import { RefreshCw } from 'lucide-react';

const PAGE_SIZE = 20;

export default function History() {
    const [products, setProducts] = useState<Product[]>([]);
    const [items, setItems] = useState<HistoryItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadKey, setReloadKey] = useState(0);

    const [productFilter, setProductFilter] = useState<number | ''>('');
    const [typeFilter, setTypeFilter] = useState<'' | 'stock_in' | 'sale'>('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        getAllActiveProducts().then(setProducts).catch(() => { });
    }, []);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        getHistory({
            page,
            page_size: PAGE_SIZE,
            product_id: productFilter || undefined,
            type: typeFilter || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
        })
            .then((response) => {
                if (cancelled) return;
                setItems(response.items);
                setTotal(response.total);
            })
            .catch((error) => {
                if (!cancelled) toast.error(getErrorMessage(error));
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [page, productFilter, typeFilter, dateFrom, dateTo, reloadKey]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const resetFilters = () => {
        setProductFilter('');
        setTypeFilter('');
        setDateFrom('');
        setDateTo('');
        setPage(1);
    };

    return (
        <div>
            <PageHeader title="Stock History" />
            <Card>
                <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <select
                        value={productFilter}
                        onChange={(e) => {
                            setProductFilter(e.target.value ? Number(e.target.value) : '');
                            setPage(1);
                        }}
                        className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                    >
                        <option value="">All Laptops</option>
                        {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>

                    <select
                        value={typeFilter}
                        onChange={(e) => {
                            setTypeFilter(e.target.value as '' | 'stock_in' | 'sale');
                            setPage(1);
                        }}
                        className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                    >
                        <option value="">All Types</option>
                        <option value="stock_in">Stock In</option>
                        <option value="sale">Sale</option>
                    </select>

                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => {
                            setDateFrom(e.target.value);
                            setPage(1);
                        }}
                        placeholder="From"
                        className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                    />

                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => {
                            setDateTo(e.target.value);
                            setPage(1);
                        }}
                        placeholder="To"
                        className="h-10 rounded-lg border border-slate-300 px-3 text-sm"
                    />
                </div>

                <div className="mb-3 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setReloadKey((k) => k + 1)}>
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </Button>
                    <Button variant="ghost" onClick={resetFilters}>Reset filters</Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12"><Spinner /></div>
                ) : items.length === 0 ? (
                    <EmptyState message="No history records yet." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Laptop</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Qty</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Unit price</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Total</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {items.map((item) => (
                                    <tr key={`${item.type}-${item.record_id}`} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 text-sm text-slate-600">{formatDate(item.date)}</td>
                                        <td className="px-4 py-3">
                                            <Badge color={item.type === 'stock_in' ? 'green' : 'blue'}>
                                                {item.type === 'stock_in' ? 'Stock In' : 'Sale'}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-slate-900">{item.product_name}</td>
                                        <td className={`px-4 py-3 text-sm font-semibold ${item.type === 'stock_in' ? 'text-green-600' : 'text-blue-600'}`}>
                                            {item.type === 'stock_in' ? '+' : '−'}{item.quantity}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {item.unit_price ? formatCurrency(item.unit_price) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">
                                            {item.total_amount ? formatCurrency(item.total_amount) : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600">{item.performed_by_name}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-slate-600">Page {page} of {totalPages} · {total} record(s)</span>
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</Button>
                        <Button variant="secondary" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}