import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import PageHeader from '../components/common/PageHeader';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import Badge from '../components/common/Badge';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ProductDetailsModal from '../components/products/ProductDetailsModal';
import { listProducts, deleteProduct, updateProduct } from '../services/productService';
import { listBrands } from '../services/brandService';
import { listCategories } from '../services/categoryService';
import type { Product } from '../types/product';
import type { Brand, Category } from '../types/catalog';
import { useAuth } from '../hooks/useAuth';
import { getErrorMessage } from '../utils/errors';
import { formatCurrency } from '../utils/formatters';

export default function Products() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState<number | ''>('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [showInactive, setShowInactive] = useState(false);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await listProducts({
        search: search || undefined,
        brand_id: brandFilter || undefined,
        category_id: categoryFilter || undefined,
        include_inactive: showInactive,
        page_size: 100,
      });
      setProducts(data.items);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([listBrands(), listCategories()])
      .then(([b, c]) => { setBrands(b.items); setCategories(c.items); })
      .catch(() => {});
  }, []);

  useEffect(() => { load(); }, [search, brandFilter, categoryFilter, showInactive]);

  const handleDelete = async () => {
    if (!deleting) return;
    setIsSubmitting(true);
    try {
      await deleteProduct(deleting.id);
      toast.success('Product deleted.');
      setDeleting(null);
      await load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsSubmitting(false); }
  };

  const handleToggleActive = async (p: Product) => {
    try {
      await updateProduct(p.id, {
        name: p.name, brand_id: p.brand_id, category_id: p.category_id,
        model: p.model, processor: p.processor, ram: p.ram, storage: p.storage,
        purchase_price: Number(p.purchase_price), selling_price: Number(p.selling_price),
        min_stock_level: p.min_stock_level, description: p.description,
        is_active: !p.is_active,
      });
      toast.success(p.is_active ? 'Product deactivated.' : 'Product activated.');
      await load();
    } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const statusBadge = (p: Product) => {
    if (p.quantity === 0) return <Badge color="red">Out of Stock</Badge>;
    if (p.is_low_stock) return <Badge color="amber">Low Stock</Badge>;
    return <Badge color="green">In Stock</Badge>;
  };

  return (
    <div>
      <PageHeader
        title="Products"
        action={isAdmin ? (
          <Link to="/products/new">
            <Button><Plus className="h-4 w-4" /> Add Product</Button>
          </Link>
        ) : undefined}
      />
      <Card>
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text" placeholder="Search by name or model..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value ? Number(e.target.value) : '')}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm">
            <option value="">All Brands</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value ? Number(e.target.value) : '')}
            className="h-10 rounded-lg border border-slate-300 px-3 text-sm">
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {isAdmin && (
          <label className="mb-3 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Show inactive
          </label>
        )}

        {isLoading ? <div className="flex justify-center py-12"><Spinner /></div>
          : products.length === 0 ? <EmptyState message="No products yet." />
          : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Brand</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Model</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {p.name} {!p.is_active && <Badge color="slate">Inactive</Badge>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.brand_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.model}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{p.quantity}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatCurrency(p.selling_price)}</td>
                    <td className="px-4 py-3">{statusBadge(p)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" onClick={() => setViewing(p)}><Eye className="h-4 w-4" /></Button>
                        {isAdmin && (
                          <>
                            <Link to={`/products/${p.id}/edit`}><Button variant="ghost"><Pencil className="h-4 w-4" /></Button></Link>
                            <Button variant="ghost" onClick={() => setDeleting(p)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                            <Button variant="ghost" onClick={() => handleToggleActive(p)}>
                              {p.is_active ? 'Deactivate' : 'Activate'}
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ProductDetailsModal product={viewing} onClose={() => setViewing(null)} />
      <ConfirmDialog isOpen={deleting !== null} onCancel={() => setDeleting(null)} onConfirm={handleDelete}
        title="Delete Product?" message={`Delete ${deleting?.name}? Products with history cannot be deleted.`}
        isLoading={isSubmitting} />
    </div>
  );
}