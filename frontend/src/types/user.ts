export type UserRole = 'admin' | 'staff';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface UserCreate {
  full_name: string;
  email: string;
  password: string;
}

export interface UserUpdate {
  full_name?: string;
  email?: string;
  is_active?: boolean;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}
