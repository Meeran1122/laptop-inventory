import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import PageHeader from '../components/common/PageHeader';
import Spinner from '../components/common/Spinner';
import { createProduct, getProduct, updateProduct } from '../services/productService';
import { listBrands } from '../services/brandService';
import { listCategories } from '../services/categoryService';
import type { Brand, Category } from '../types/catalog';
import { getErrorMessage } from '../utils/errors';

const PROCESSOR_OPTIONS = [
  'Core i3', 'Core i5', 'Core i7', 'Core i9',
  'Ryzen 3', 'Ryzen 5', 'Ryzen 7', 'Ryzen 9',
  'Snapdragon X', 'Snapdragon X Elite', 'Intel Celeron',
  'Intel Xeon', 'Pentium',
];

const RAM_OPTIONS = [
  '4GB', '8GB', '12GB', '16GB', '24GB', '32GB', '64GB',
];

const STORAGE_OPTIONS = [
  '128GB SSD', '256GB SSD', '512GB SSD', '1TB SSD',
  '128GB HDD', '256GB HDD', '512GB HDD', '1TB HDD',
  '256GB SSD + 1TB HDD', '512GB SSD + 1TB HDD',
];

// Datalist input — dropdown + manual typing dono support karta hai
interface DatalistInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
  placeholder?: string;
}

function DatalistInput({ label, value, onChange, options, required, placeholder }: DatalistInputProps) {
  const listId = `datalist-${label.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <div className="w-full">
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="text"
        list={listId}
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </div>
  );
}

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(isEdit);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    brand_id: 0,
    category_id: 0,
    model: '',
    processor: '',
    ram: '',
    storage: '',
    purchase_price: '',
    selling_price: '',
    min_stock_level: 0,
    description: '',
    is_active: true,
  });

  useEffect(() => {
    Promise.all([listBrands(), listCategories()])
      .then(([b, c]) => {
        setBrands(b.items);
        setCategories(c.items);
      })
      .catch((err) => toast.error(getErrorMessage(err)));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    getProduct(Number(id))
      .then((p) =>
        setForm({
          name: p.name,
          brand_id: p.brand_id,
          category_id: p.category_id,
          model: p.model,
          processor: p.processor,
          ram: p.ram,
          storage: p.storage,
          purchase_price: p.purchase_price,
          selling_price: p.selling_price,
          min_stock_level: p.min_stock_level,
          description: p.description ?? '',
          is_active: p.is_active,
        }),
      )
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) return setError('Name is required.');
    if (!form.brand_id) return setError('Please select a brand.');
    if (!form.category_id) return setError('Please select a category.');
    if (!form.model.trim()) return setError('Model is required.');
    if (!form.processor.trim()) return setError('Processor is required.');
    if (!form.ram.trim()) return setError('RAM is required.');
    if (!form.storage.trim()) return setError('Storage is required.');
    if (!form.purchase_price) return setError('Purchase price is required.');
    if (!form.selling_price) return setError('Selling price is required.');

    setIsSubmitting(true);
    try {
      // IMPORTANT: only the exact 11 fields — no quantity, no id, no extra keys.
      const payload = {
        name: form.name.trim(),
        brand_id: form.brand_id,
        category_id: form.category_id,
        model: form.model.trim(),
        processor: form.processor.trim(),
        ram: form.ram.trim(),
        storage: form.storage.trim(),
        purchase_price: Number(form.purchase_price),
        selling_price: Number(form.selling_price),
        min_stock_level: form.min_stock_level,
        description: form.description.trim() || null,
        ...(isEdit ? { is_active: form.is_active } : {}),
      };

      if (isEdit) {
        await updateProduct(Number(id), payload as never);
        toast.success('Product updated.');
      } else {
        await createProduct(payload as never);
        toast.success('Product created.');
      }
      navigate('/products');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={isEdit ? 'Edit Product' : 'Add Product'} />
      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            placeholder="Dell Latitude 5420"
          />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Brand</label>
            <select
              required
              value={form.brand_id}
              onChange={(e) => setForm({ ...form, brand_id: Number(e.target.value) })}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Select brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Category</label>
            <select
              required
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: Number(e.target.value) })}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={0}>Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Model"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value })}
            required
            placeholder="Latitude 5420"
          />

          <DatalistInput
            label="Processor"
            value={form.processor}
            onChange={(v) => setForm({ ...form, processor: v })}
            options={PROCESSOR_OPTIONS}
            required
            placeholder="Core i5 11th Gen"
          />

          <DatalistInput
            label="RAM"
            value={form.ram}
            onChange={(v) => setForm({ ...form, ram: v })}
            options={RAM_OPTIONS}
            required
            placeholder="8GB"
          />

          <DatalistInput
            label="Storage"
            value={form.storage}
            onChange={(v) => setForm({ ...form, storage: v })}
            options={STORAGE_OPTIONS}
            required
            placeholder="256GB SSD"
          />

          <Input
            label="Purchase Price (Rs.)"
            type="number"
            min="0"
            step="0.01"
            value={form.purchase_price}
            onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
            required
          />

          <Input
            label="Selling Price (Rs.)"
            type="number"
            min="0"
            step="0.01"
            value={form.selling_price}
            onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
            required
          />

          <Input
            label="Minimum Stock Level"
            type="number"
            min="0"
            value={form.min_stock_level}
            onChange={(e) => setForm({ ...form, min_stock_level: Number(e.target.value) })}
            required
          />

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="min-h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional notes about this product..."
            />
          </div>

          {isEdit && (
            <label className="flex items-center gap-2 text-sm text-slate-700 md:col-span-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              />
              Active
            </label>
          )}

          {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}

          <div className="flex gap-2 md:col-span-2">
            <Button type="submit" isLoading={isSubmitting}>
              {isEdit ? 'Save Changes' : 'Create Product'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/products')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}