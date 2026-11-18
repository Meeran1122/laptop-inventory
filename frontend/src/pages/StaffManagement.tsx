import { useEffect, useState } from 'react';
import { Plus, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import PageHeader from '../components/common/PageHeader';
import Spinner from '../components/common/Spinner';
import EmptyState from '../components/common/EmptyState';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { listUsers, createStaff, updateUser } from '../services/userService';
import type { User } from '../types/user';
import { getErrorMessage } from '../utils/errors';
import { formatDate } from '../utils/formatters';

export default function StaffManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmUser, setConfirmUser] = useState<User | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const data = await listUsers({ page_size: 100 });
      setUsers(data.items.filter((u) => u.role === 'staff'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openCreate = () => {
    setEditingUser(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFullName(user.full_name);
    setEmail(user.email);
    setPassword('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    setFormError('');
    if (!fullName.trim() || !email.trim()) {
      setFormError('Full name and email are required.');
      return;
    }
    if (!editingUser && password.length < 8) {
      setFormError('Password must be at least 8 characters.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, { full_name: fullName.trim(), email: email.trim() });
        toast.success('Staff updated.');
      } else {
        await createStaff({ full_name: fullName.trim(), email: email.trim(), password });
        toast.success('Staff created.');
      }
      setIsModalOpen(false);
      await loadUsers();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!confirmUser) return;
    setIsSubmitting(true);
    try {
      await updateUser(confirmUser.id, { is_active: !confirmUser.is_active });
      toast.success(confirmUser.is_active ? 'Staff deactivated.' : 'Staff activated.');
      setConfirmUser(null);
      await loadUsers();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Staff Management"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Staff
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : users.length === 0 ? (
          <EmptyState message="No staff accounts yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500">Created</th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">{u.full_name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <Badge color={u.is_active ? 'green' : 'slate'}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{formatDate(u.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => openEdit(u)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={u.is_active ? 'danger' : 'secondary'}
                          onClick={() => setConfirmUser(u)}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Edit Staff' : 'Add Staff'}
      >
        <div className="space-y-4">
          <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          {!editingUser && (
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
          {formError && <p className="text-xs text-red-600">{formError}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} isLoading={isSubmitting}>
              {editingUser ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmUser !== null}
        onCancel={() => setConfirmUser(null)}
        onConfirm={handleToggleActive}
        title={confirmUser?.is_active ? 'Deactivate Staff?' : 'Activate Staff?'}
        message={
          confirmUser?.is_active
            ? `Deactivate ${confirmUser.full_name}? They will not be able to log in.`
            : `Activate ${confirmUser?.full_name}?`
        }
        isLoading={isSubmitting}
      />
    </div>
  );
}