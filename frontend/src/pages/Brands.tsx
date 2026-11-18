import { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import PageHeader from '../components/common/PageHeader';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { listBrands, createBrand, updateBrand, deleteBrand } from '../services/brandService';
import type { Brand } from '../types/catalog';
import { getErrorMessage } from '../utils/errors';
import { formatDate } from '../utils/formatters';

export default function Brands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirm, setConfirm] = useState<Brand | null>(null);
  const [formError, setFormError] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await listBrands();
      setBrands(data.items);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setName(''); setFormError(''); setIsModalOpen(true); };
  const openEdit = (b: Brand) => { setEditing(b); setName(b.name); setFormError(''); setIsModalOpen(true); };

  const handleSubmit = async () => {
    setFormError('');
    if (!name.trim()) { setFormError('Name is required.'); return; }
    setIsSubmitting(true);
    try {
      if (editing) { await updateBrand(editing.id, { name: name.trim() }); toast.success('Brand updated.'); }
      else { await createBrand({ name: name.trim() }); toast.success('Brand created.'); }
      setIsModalOpen(false);
      await load();
    } catch (err) { setFormError(getErrorMessage(err)); }
    finally { setIsSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!confirm) return;
    setIsSubmitting(true);
    try {
      await deleteBrand(confirm.id);
      toast.success('Brand deleted.');
      setConfirm(null);
      await load();
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setIsSubmitting(false); }
  };

  return (
    <div>
      <PageHeader title="Brands" action={<Button onClick={openCreate}><Plus className="h-4 w-4" /> Add Brand</Button>} />
      <Card>
        {isLoading ? <div className="flex justify-center py-12"><Spinner /></div>
          : brands.length === 0 ? <EmptyState message="No brands yet." />
          : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {brands.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">{b.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(b.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => openEdit(b)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" onClick={() => setConfirm(b)}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Brand' : 'Add Brand'}>
        <div className="space-y-4">
          <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          {formError && <p className="text-xs text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting}>{editing ? 'Save' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={confirm !== null} onCancel={() => setConfirm(null)} onConfirm={handleDelete}
        title="Delete Brand?" message={`Delete ${confirm?.name}? This cannot be undone.`} isLoading={isSubmitting} />
    </div>
  );
}