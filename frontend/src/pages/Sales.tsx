import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import EmptyState from '../components/common/EmptyState';
import Input from '../components/common/Input';
import PageHeader from '../components/common/PageHeader';
import Spinner from '../components/common/Spinner';
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
  const { isAdmin } = useAuth();
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

  const [records, setRecords] = useState<SaleRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isRecordsLoading, setIsRecordsLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

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
        if (cancelled) return;
        setRecords(response.items);
        setTotal(response.total);
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

  if (isProductsLoading) return <Spinner />;

  return (
    <>
      <PageHeader title="Sales" />

      {products.length === 0 ? (
        <Card>
          <EmptyState
            message={
              isAdmin
                ? 'There are no active products yet. Add a product first.'
                : 'There are no active products yet. Ask an Admin to add products.'
            }
          />
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
          <Card className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Record a sale</h2>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Laptop</label>
                <select
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Input
                    label="Quantity sold"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 2"
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
                  <Input
                    label="Selling price per unit (Rs.)"
                    type="number"
                    min="0"
                    step="0.01"
                    {...register('selling_price', {
                      required: 'Selling price is required',
                      validate: validatePrice,
                    })}
                  />
                  {errors.selling_price && (
                    <p className="mt-1 text-xs text-red-600">{errors.selling_price.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Input
                  label="Sale date"
                  type="date"
                  max={today()}
                  {...register('sale_date', {
                    required: 'Date is required',
                    validate: (v) => v <= today() || 'Date cannot be in the future',
                  })}
                />
                {errors.sale_date && <p className="mt-1 text-xs text-red-600">{errors.sale_date.message}</p>}
              </div>

              <div className="rounded-lg bg-blue-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-700">Total amount</p>
                <p className="mt-1 text-3xl font-semibold text-blue-700">
                  {totalAmount ? formatCurrency(totalAmount) : '—'}
                </p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" isLoading={isSubmitting}>
                  Submit Sale
                </Button>
              </div>
            </form>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Selected laptop</h2>
            {selectedProduct && selectedStatus ? (
              <div className="space-y-4">
                <div>
                  <p className="font-medium text-slate-900">{selectedProduct.name}</p>
                  <p className="text-xs text-slate-500">
                    {selectedProduct.brand_name} · {selectedProduct.model}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedProduct.processor} · {selectedProduct.ram} · {selectedProduct.storage}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Current quantity</p>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-3xl font-semibold text-slate-900">{selectedProduct.quantity}</span>
                    <Badge color={selectedStatus.color}>{selectedStatus.label}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Minimum stock: {selectedProduct.min_stock_level}</p>
                </div>
                {remaining !== null && (
                  <div className={`rounded-lg p-4 ${remaining < 0 ? 'bg-red-50' : 'bg-amber-50'}`}>
                    <p
                      className={`text-xs font-medium uppercase tracking-wide ${
                        remaining < 0 ? 'text-red-700' : 'text-amber-700'
                      }`}
                    >
                      Quantity after this sale
                    </p>
                    <p
                      className={`mt-1 text-3xl font-semibold ${
                        remaining < 0 ? 'text-red-700' : 'text-amber-700'
                      }`}
                    >
                      {remaining}
                    </p>
                    {remaining < 0 && <p className="mt-1 text-xs text-red-600">Not enough stock</p>}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Select a laptop to see its current stock.</p>
            )}
          </Card>
        </div>
      )}

      <Card className="mt-6">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Recent sales</h2>
        {isRecordsLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : records.length === 0 ? (
          <EmptyState message="No sales yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Laptop</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Unit price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Sold by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(record.sale_date)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{record.product_name}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-blue-600">{record.quantity}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(record.selling_price)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{formatCurrency(record.total_amount)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{record.created_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-slate-600">
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
    </>
  );
}