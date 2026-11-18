import {api} from './api';
import type { Category, CategoryCreate, ListCategoriesResponse } from '../types/catalog';

export async function listCategories(): Promise<ListCategoriesResponse> {
  const response = await api.get<ListCategoriesResponse>('/categories');
  return response.data;
}

export async function createCategory(payload: CategoryCreate): Promise<Category> {
  const response = await api.post<Category>('/categories', payload);
  return response.data;
}

export async function updateCategory(id: number, payload: CategoryCreate): Promise<Category> {
  const response = await api.put<Category>(`/categories/${id}`, payload);
  return response.data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
}