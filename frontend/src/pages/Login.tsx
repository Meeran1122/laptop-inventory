import { Laptop } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';

import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../utils/constants';
import { getErrorMessage } from '../utils/errors';

interface LoginFormValues {
  email: string;
  password: string;
}

export default function Login() {
  const { user, isLoading, login } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>();

  if (!isLoading && user) return <Navigate to={ROUTES.dashboard} replace />;

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMessage('');
    try {
      await login(values.email.trim(), values.password);
      navigate(ROUTES.dashboard, { replace: true });
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Laptop className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Laptop Store</h1>
          <p className="mt-1 text-sm text-slate-600">Sign in to your account</p>
        </div>
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            {errorMessage && (
              <div className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{errorMessage}</div>
            )}
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
              })}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              placeholder="Your password"
              error={errors.password?.message}
              {...register('password', { required: 'Password is required' })}
            />
            <Button type="submit" className="w-full" isLoading={isSubmitting}>
              Login
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
