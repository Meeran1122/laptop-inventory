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
import { createStockIn, getStockIns } from '../services/stockService';
import type { Product } from '../types/product';
import type { StockIn as StockInRecord, StockInPayload } from '../types/stock';
import { ROUTES } from '../utils/constants';
import { getErrorMessage } from '../utils/errors';
import { formatCurrency, formatDate, today } from '../utils/formatters';

const PAGE_SIZE = 10;
const MAX_QUANTITY = 100000;

interface StockInFormValues {
  product_id: string;
  quantity: string;
  purchase_price: string;
  stock_date: string;
  notes: string;
}

function getDefaultValues(): StockInFormValues {
  return { product_id: '', quantity: '', purchase_price: '', stock_date: today(), notes: '' };
}

function validateQuantity(value: string): true | string {
  if (!/^\d+$/.test(value)) return 'Enter a whole number';
  const quantity = Number(value);
  if (quantity < 1) return 'Quantity must be at least 1';
  if (quantity > MAX_QUANTITY) return `Quantity cannot be more than ${MAX_QUANTITY.toLocaleString('en-US')}`;
  return true;
}

function validateOptionalPrice(value: string): true | string {
  if (value.trim() === '') return true;
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'Enter a valid amount (max 2 decimals)';
  if (Number(value) > 9999999999.99) return 'Amount is too large';
  return true;
}

function stockStatus(quantity: number, minStockLevel: number): { label: string; color: 'green' | 'amber' | 'red' } {
  if (quantity === 0) return { label: 'Out of Stock', color: 'red' };
  if (quantity < minStockLevel) return { label: 'Low Stock', color: 'amber' };
  return { label: 'In Stock', color: 'green' };
}

export default function StockIn() {
  const { isAdmin } = useAuth();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<StockInFormValues>({ defaultValues: getDefaultValues() });

  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);

  const [records, setRecords] = useState<StockInRecord[]>([]);
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
    let isCancelled = false;
    setIsRecordsLoading(true);
    getStockIns({ page, page_size: PAGE_SIZE })
      .then((response) => {
        if (isCancelled) return;
        setRecords(response.items);
        setTotal(response.total);
      })
      .catch((error) => {
        if (!isCancelled) toast.error(getErrorMessage(error));
      })
      .finally(() => {
        if (!isCancelled) setIsRecordsLoading(false);
      });
    return () => {
      isCancelled = true;
    };
  }, [page, reloadKey]);

  const productId = watch('product_id');
  const quantityText = watch('quantity');
  const selectedProduct = products.find((product) => String(product.id) === productId);
  const hasValidQuantity = validateQuantity(quantityText) === true;
  const newQuantity =
    selectedProduct && hasValidQuantity ? selectedProduct.quantity + Number(quantityText) : null;
  const selectedStatus = selectedProduct
    ? stockStatus(selectedProduct.quantity, selectedProduct.min_stock_level)
    : null;

  const onSubmit = async (values: StockInFormValues) => {
    const payload: StockInPayload = {
      product_id: Number(values.product_id),
      quantity: Number(values.quantity),
      stock_date: values.stock_date,
    };
    if (values.purchase_price.trim() !== '') payload.purchase_price = Number(values.purchase_price);
    if (values.notes.trim() !== '') payload.notes = values.notes.trim();

    try {
      const result = await createStockIn(payload);
      toast.success(`Stock added. ${result.product_name} now has ${result.new_quantity} units.`);
      setProducts((current) =>
        current.map((product) =>
          product.id === result.product_id && result.new_quantity !== null
            ? { ...product, quantity: result.new_quantity }
            : product,
        ),
      );
      reset({ ...getDefaultValues(), stock_date: values.stock_date });
      setPage(1);
      setReloadKey((key) => key + 1);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (isProductsLoading) return <Spinner />;

  return (
    <>
      <PageHeader title="Stock In" />

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
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Record incoming stock</h2>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Laptop</label>
                <select
                  className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('product_id', { required: 'Please select a laptop' })}
                >
                  <option value="">Select a laptop</option>
                  {products.map((product) => (
                    <option key={product.id} value={String(product.id)}>
                      {product.name} — {product.processor}, {product.ram}, {product.storage}
                    </option>
                  ))}
                </select>
                {errors.product_id && (
                  <p className="mt-1 text-xs text-red-600">{errors.product_id.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Input
                    label="Quantity received"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 3"
                    {...register('quantity', {
                      required: 'Quantity is required',
                      validate: validateQuantity,
                    })}
                  />
                  {errors.quantity && (
                    <p className="mt-1 text-xs text-red-600">{errors.quantity.message}</p>
                  )}
                </div>
                <div>
                  <Input
                    label="Purchase price per unit (Rs.) — optional"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={
                      selectedProduct ? `Usual: ${formatCurrency(selectedProduct.purchase_price)}` : 'Optional'
                    }
                    {...register('purchase_price', { validate: validateOptionalPrice })}
                  />
                  {errors.purchase_price && (
                    <p className="mt-1 text-xs text-red-600">{errors.purchase_price.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Input
                  label="Date received"
                  type="date"
                  max={today()}
                  {...register('stock_date', {
                    required: 'Date is required',
                    validate: (value) => value <= today() || 'Date cannot be in the future',
                  })}
                />
                {errors.stock_date && (
                  <p className="mt-1 text-xs text-red-600">{errors.stock_date.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Notes — optional</label>
                <textarea
                  placeholder="e.g. Supplier name or invoice number"
                  className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('notes', { maxLength: { value: 500, message: 'Maximum 500 characters' } })}
                />
                {errors.notes && <p className="mt-1 text-xs text-red-600">{errors.notes.message}</p>}
              </div>

              <div className="flex justify-end">
                <Button type="submit" isLoading={isSubmitting}>
                  Submit Stock In
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
                {newQuantity !== null && (
                  <div className="rounded-lg bg-blue-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-blue-700">
                      Quantity after this stock in
                    </p>
                    <p className="mt-1 text-3xl font-semibold text-blue-700">{newQuantity}</p>
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
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Recent stock in</h2>
        {isRecordsLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : records.length === 0 ? (
          <EmptyState message="No stock-in records yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Laptop</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Purchase price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Notes</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Recorded by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(record.stock_date)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{record.product_name}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-600">+{record.quantity}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {record.purchase_price ? formatCurrency(record.purchase_price) : '—'}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-sm text-slate-600">{record.notes ?? '—'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{record.created_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-slate-600">
            Page {page} of {totalPages} · {total} record(s)
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