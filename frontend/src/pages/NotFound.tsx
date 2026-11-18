import { Link } from 'react-router-dom';

import { ROUTES } from '../utils/constants';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 p-4 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="text-sm text-slate-600">The page you are looking for does not exist.</p>
      <Link to={ROUTES.dashboard} className="text-sm font-medium text-blue-600 hover:text-blue-700">
        Go to Dashboard
      </Link>
    </div>
  );
}
