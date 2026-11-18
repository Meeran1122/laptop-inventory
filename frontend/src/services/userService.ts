import { api } from './api';
import type { User, UserCreate, UserUpdate } from '../types/user';

export interface ListUsersResponse {
  items: User[];
  total: number;
  page: number;
  page_size: number;
}

export async function listUsers(params?: {
  page?: number;
  page_size?: number;
  search?: string;
}): Promise<ListUsersResponse> {
  const response = await api.get<ListUsersResponse>('/users', { params });
  return response.data;
}

export async function createStaff(payload: UserCreate): Promise<User> {
  const response = await api.post<User>('/users', payload);
  return response.data;
}

export async function updateUser(id: number, payload: UserUpdate): Promise<User> {
  const response = await api.put<User>(`/users/${id}`, payload);
  return response.data;
}