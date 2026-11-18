import { useEffect, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import { Navigate } from 'react-router-dom';

import Spinner from '../components/common/Spinner';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/user';
import { ROUTES } from '../utils/constants';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
  children: ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const isDenied = user !== null && allowedRoles !== undefined && !allowedRoles.includes(user.role);

  useEffect(() => {
    if (isDenied) {
      toast.error('You do not have permission to open that page.', { id: 'permission-denied' });
    }
  }, [isDenied]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!user) return <Navigate to={ROUTES.login} replace />;
  if (isDenied) return <Navigate to={ROUTES.dashboard} replace />;
  return <>{children}</>;
}
