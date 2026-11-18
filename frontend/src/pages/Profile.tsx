import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import PageHeader from '../components/common/PageHeader';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/formatters';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div>
      <PageHeader title="My Profile" />
      <Card>
        <dl className="space-y-4">
          <div>
            <dt className="text-sm text-slate-600">Full Name</dt>
            <dd className="text-sm font-medium text-slate-900">{user.full_name}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-600">Email</dt>
            <dd className="text-sm font-medium text-slate-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-600">Role</dt>
            <dd>
              <Badge color={user.role === 'admin' ? 'blue' : 'slate'}>
                {user.role === 'admin' ? 'Admin' : 'Staff'}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-600">Status</dt>
            <dd>
              <Badge color={user.is_active ? 'green' : 'slate'}>
                {user.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-sm text-slate-600">Member since</dt>
            <dd className="text-sm font-medium text-slate-900">{formatDate(user.created_at)}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}