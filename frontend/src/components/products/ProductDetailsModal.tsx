import Modal from '../common/Modal';
import Badge from '../common/Badge';
import type { Product } from '../../types/product';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface Props {
  product: Product | null;
  onClose: () => void;
}

export default function ProductDetailsModal({ product, onClose }: Props) {
  if (!product) return null;
  return (
    <Modal isOpen={true} onClose={onClose} title={product.name}>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div><dt className="text-slate-600">Brand</dt><dd className="font-medium">{product.brand_name}</dd></div>
        <div><dt className="text-slate-600">Category</dt><dd className="font-medium">{product.category_name}</dd></div>
        <div><dt className="text-slate-600">Model</dt><dd className="font-medium">{product.model}</dd></div>
        <div><dt className="text-slate-600">Processor</dt><dd className="font-medium">{product.processor}</dd></div>
        <div><dt className="text-slate-600">RAM</dt><dd className="font-medium">{product.ram}</dd></div>
        <div><dt className="text-slate-600">Storage</dt><dd className="font-medium">{product.storage}</dd></div>
        <div><dt className="text-slate-600">Purchase Price</dt><dd className="font-medium">{formatCurrency(product.purchase_price)}</dd></div>
        <div><dt className="text-slate-600">Selling Price</dt><dd className="font-medium">{formatCurrency(product.selling_price)}</dd></div>
        <div><dt className="text-slate-600">Quantity</dt><dd className="font-medium">{product.quantity}</dd></div>
        <div><dt className="text-slate-600">Min Stock</dt><dd className="font-medium">{product.min_stock_level}</dd></div>
        <div><dt className="text-slate-600">Status</dt><dd>
          <Badge color={product.is_active ? 'green' : 'slate'}>{product.is_active ? 'Active' : 'Inactive'}</Badge>
        </dd></div>
        <div><dt className="text-slate-600">Stock</dt><dd>
          <Badge color={product.quantity === 0 ? 'red' : product.is_low_stock ? 'amber' : 'green'}>
            {product.quantity === 0 ? 'Out of Stock' : product.is_low_stock ? 'Low Stock' : 'In Stock'}
          </Badge>
        </dd></div>
      </dl>
      {product.description && (
        <div className="mt-4">
          <dt className="text-sm text-slate-600">Description</dt>
          <dd className="text-sm text-slate-900 mt-1">{product.description}</dd>
        </div>
      )}
      <div className="mt-4 text-xs text-slate-500">Added {formatDate(product.created_at)}</div>
    </Modal>
  );
}