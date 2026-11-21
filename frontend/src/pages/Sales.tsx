import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Printer, Search } from 'lucide-react';

import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Input from '../components/common/Input';
import PageHeader from '../components/common/PageHeader';
import Spinner from '../components/common/Spinner';
import InvoiceModal from '../components/sales/InvoiceModal';
import { useAuth } from '../hooks/useAuth';
import { getAllActiveProducts } from '../services/productService';
import { createSale, getSales } from '../services/stockService';
import type { Product } from '../types/product';
import type { Sale as SaleRecord, SalePayload } from '../types/stock';
import { ROUTES } from '../utils/constants';
import { getErrorMessage } from '../utils/errors';
import { formatCurrency, formatDate, today } from '../utils/formatters';

const PAGE_SIZE = 10;
const MAX_QUANTITY = 100000;

interface SaleFormValues {
  product_id: string;
  quantity: string;
  selling_price: string;
  sale_date: string;
}

function getDefaultValues(): SaleFormValues {
  return { product_id: '', quantity: '', selling_price: '', sale_date: today() };
}

function validateQuantity(value: string): true | string {
  if (!/^\d+$/.test(value)) return 'Enter a whole number';
  const quantity = Number(value);
  if (quantity < 1) return 'Quantity must be at least 1';
  if (quantity > MAX_QUANTITY) return `Quantity cannot be more than ${MAX_QUANTITY.toLocaleString('en-US')}`;
  return true;
}

function validatePrice(value: string): true | string {
  if (value.trim() === '') return 'Selling price is required';
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'Enter a valid amount (max 2 decimals)';
  if (Number(value) > 9999999999.99) return 'Amount is too large';
  return true;
}

function stockStatus(quantity: number, minStockLevel: number): { label: string; color: 'green' | 'amber' | 'red' } {
  if (quantity === 0) return { label: 'Out of Stock', color: 'red' };
  if (quantity < minStockLevel) return { label: 'Low Stock', color: 'amber' };
  return { label: 'In Stock', color: 'green' };
}

export default function Sales() {
  const { isAdmin, user } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SaleFormValues>({ defaultValues: getDefaultValues() });

  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<SaleRecord | null>(null);

  const [records, setRecords] = useState<SaleRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isRecordsLoading, setIsRecordsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  // Filters for Recent Sales
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    getAllActiveProducts()
      .then(setProducts)
      .catch((error) => toast.error(getErrorMessage(error)))
      .finally(() => setIsProductsLoading(false));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsRecordsLoading(true);
    getSales({ page, page_size: PAGE_SIZE })
      .then((response) => {
        if (!cancelled) {
          setRecords(response.items);
          setTotal(response.total);
        }
      })
      .catch((error) => {
        if (!cancelled) toast.error(getErrorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setIsRecordsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, reloadKey]);

  const productId = watch('product_id');
  const quantityText = watch('quantity');
  const priceText = watch('selling_price');

  const selectedProduct = products.find((p) => String(p.id) === productId);
  const hasValidQty = validateQuantity(quantityText) === true;
  const hasValidPrice = validatePrice(priceText) === true;

  const remaining =
    selectedProduct && hasValidQty ? selectedProduct.quantity - Number(quantityText) : null;
  const totalAmount =
    hasValidQty && hasValidPrice ? (Number(quantityText) * Number(priceText)).toFixed(2) : null;
  const selectedStatus = selectedProduct
    ? stockStatus(selectedProduct.quantity, selectedProduct.min_stock_level)
    : null;

  // Auto-prefill selling price from product when selected
  useEffect(() => {
    if (selectedProduct) {
      setValue('selling_price', selectedProduct.selling_price);
    }
  }, [selectedProduct, setValue]);

  const onSubmit = async (values: SaleFormValues) => {
    if (selectedProduct && Number(values.quantity) > selectedProduct.quantity) {
      toast.error(`Only ${selectedProduct.quantity} unit(s) available.`);
      return;
    }

    const payload: SalePayload = {
      product_id: Number(values.product_id),
      quantity: Number(values.quantity),
      selling_price: Number(values.selling_price),
      sale_date: values.sale_date,
    };

    try {
      const result = await createSale(payload);
      toast.success(`Sale recorded. ${result.product_name} now has ${result.remaining_quantity} units.`);

      setSelectedInvoice(result); // Open Invoice

      setProducts((current) =>
        current.map((p) =>
          p.id === result.product_id && result.remaining_quantity !== null
            ? { ...p, quantity: result.remaining_quantity }
            : p,
        ),
      );
      reset({ ...getDefaultValues(), sale_date: values.sale_date });
      setPage(1);
      setReloadKey((k) => k + 1);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Filter logic for table (local filtering for the current page)
  const filteredRecords = records.filter(r => {
    const matchesSearch = r.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.created_by_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDate = filterDate ? r.sale_date === filterDate : true;
    return matchesSearch && matchesDate;
  });

  // Calculate Summary Card values (Today's stats)
  const todayStr = today();
  const todaySales = records.filter(r => r.sale_date === todayStr);
  const todayAmount = todaySales.reduce((sum, r) => sum + Number(r.total_amount), 0);
  const todayUnits = todaySales.reduce((sum, r) => sum + r.quantity, 0);

  if (isProductsLoading) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Sales"
        action={
          <Button variant="secondary">
            Export CSV
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="flex items-center gap-4 !p-5">
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Today's Sales</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(todayAmount)}</p>
            <p className="text-xs text-slate-500 mt-1">{todaySales.length} transactions</p>
          </div>
          <div className="rounded-full bg-blue-50 p-3 text-blue-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </Card>
        <Card className="flex items-center gap-4 !p-5">
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Units Sold Today</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{todayUnits} Units</p>
            <p className="text-xs text-slate-500 mt-1">Across {todaySales.length} orders</p>
          </div>
          <div className="rounded-full bg-green-50 p-3 text-green-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
        </Card>
        <Card className="flex items-center gap-4 !p-5">
          <div className="flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Active Cashier</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-lg font-semibold text-slate-900">{user?.full_name || 'Admin'}</p>
              <Badge color={isAdmin ? 'blue' : 'slate'}>{isAdmin ? 'Admin' : 'Staff'}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">POS Counter 01</p>
          </div>
          <div className="rounded-full bg-slate-100 p-3 text-slate-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </Card>
      </div>

      {products.length === 0 ? (
        <Card>
          <EmptyState message="There are no active products yet. Add a product first." />
          {isAdmin && (
            <div className="mt-3 text-center">
              <Link to={ROUTES.productNew} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                Add a product
              </Link>
            </div>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Side: Form */}
          <Card className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900">Record a Sale</h2>
              <p className="text-sm text-slate-500 mt-1">Select an active laptop, enter quantity and selling price to deduct stock.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Laptop <span className="text-red-500">*</span>
                </label>
                <select
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('product_id', { required: 'Please select a laptop' })}
                >
                  <option value="">Select a laptop</option>
                  {products.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name} — {p.processor}, {p.ram}, {p.storage} (avail: {p.quantity})
                    </option>
                  ))}
                </select>
                {errors.product_id && <p className="mt-1 text-xs text-red-600">{errors.product_id.message}</p>}
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Quantity Sold <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 2"
                    className="h-11"
                    {...register('quantity', {
                      required: 'Quantity is required',
                      validate: (v) => {
                        const base = validateQuantity(v);
                        if (base !== true) return base;
                        if (selectedProduct && Number(v) > selectedProduct.quantity) {
                          return `Only ${selectedProduct.quantity} unit(s) available`;
                        }
                        return true;
                      },
                    })}
                  />
                  {errors.quantity && <p className="mt-1 text-xs text-red-600">{errors.quantity.message}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Selling Price per Unit (Rs.) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-11"
                    {...register('selling_price', {
                      required: 'Selling price is required',
                      validate: validatePrice,
                    })}
                  />
                  {errors.selling_price && <p className="mt-1 text-xs text-red-600">{errors.selling_price.message}</p>}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Sale Date <span className="text-red-500">*</span>
                </label>
                <Input
                  type="date"
                  max={today()}
                  className="h-11"
                  {...register('sale_date', {
                    required: 'Date is required',
                    validate: (v) => v <= today() || 'Date cannot be in the future',
                  })}
                />
                {errors.sale_date && <p className="mt-1 text-xs text-red-600">{errors.sale_date.message}</p>}
              </div>

              {/* Total Amount Box */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-blue-700">Total Amount</p>
                    <p className="text-xs text-blue-600 mt-1">
                      {quantityText || 0} units × Rs. {priceText || 0}
                    </p>
                  </div>
                  <p className="text-3xl font-bold text-blue-700">
                    {totalAmount ? formatCurrency(totalAmount) : 'Rs. 0'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" isLoading={isSubmitting} className="flex-1 h-12 text-base">
                  <svg className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Submit Sale
                </Button>
                <Button variant="secondary" onClick={() => reset(getDefaultValues())} className="h-12 px-6">
                  Reset
                </Button>
              </div>
            </form>
          </Card>

          {/* Right Side: Selected Laptop Preview */}
          <Card className="h-fit">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-slate-900">Selected Laptop</h2>
              <p className="text-sm text-slate-500 mt-1">Live inventory & specification preview</p>
            </div>

            {selectedProduct && selectedStatus ? (
              <div className="space-y-5">
                <div>
                  <p className="font-bold text-lg text-slate-900 leading-tight">{selectedProduct.name}</p>
                  <p className="text-xs font-medium text-slate-500 mt-1">{selectedProduct.brand_name} · {selectedProduct.model}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {selectedProduct.processor}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {selectedProduct.ram} Unified
                  </span>
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {selectedProduct.storage}
                  </span>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Current Stock</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-4xl font-bold text-slate-900">{selectedProduct.quantity}</span>
                    <Badge color={selectedStatus.color}>{selectedStatus.label}</Badge>
                  </div>
                  <p className="mt-2 text-xs font-medium text-slate-500">Minimum stock: {selectedProduct.min_stock_level}</p>
                </div>

                {remaining !== null && (
                  <div className={`rounded-xl p-4 border ${remaining < 0 ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                    <p className={`text-xs font-bold uppercase tracking-wide ${remaining < 0 ? 'text-red-700' : 'text-amber-700'}`}>
                      Quantity after this sale: {remaining}
                    </p>
                    <div className="mt-3 h-2 w-full rounded-full bg-amber-200/50 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.max(0, Math.min(100, (remaining / selectedProduct.quantity) * 100))}%` }}></div>
                    </div>
                    {remaining < 0 && <p className="mt-2 text-xs font-medium text-red-600">Not enough stock available</p>}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                </div>
                <p className="text-sm font-medium text-slate-500">Select a laptop to see its current stock.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Recent Sales Table */}
      <Card className="mt-8">
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Recent Sales</h2>
            <p className="text-sm text-slate-500 mt-1">History of recent store sales and invoices.</p>
          </div>

          {/* Table Filters */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search sales..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="relative hidden sm:block">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="h-10 rounded-lg border border-slate-300 px-3 text-sm text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {isRecordsLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : records.length === 0 ? (
          <EmptyState message="No sales yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Laptop</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Qty</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Unit Price (Rs.)</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Total (Rs.)</th>
                  <th className="pb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Sold By</th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 group transition-colors">
                    <td className="py-4 text-sm text-slate-600 whitespace-nowrap">{formatDate(record.sale_date)}</td>
                    <td className="py-4">
                      <p className="text-sm font-semibold text-slate-900">{record.product_name}</p>
                      <p className="text-xs text-slate-500">{/* Can add product brand/model if available in record */}</p>
                    </td>
                    <td className="py-4 text-sm font-medium text-blue-600">{record.quantity}</td>
                    <td className="py-4 text-sm text-slate-600">{formatCurrency(record.selling_price)}</td>
                    <td className="py-4 text-sm font-semibold text-slate-900">{formatCurrency(record.total_amount)}</td>
                    <td className="py-4 text-sm text-slate-600">{record.created_by_name}</td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(record)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        title="Print Invoice"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-slate-500">
            Page {page} of {totalPages} · {total} sale(s)
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <InvoiceModal sale={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
    </div>
  );
}