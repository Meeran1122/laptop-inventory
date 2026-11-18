import {api} from './api';
import type { Brand, BrandCreate, ListBrandsResponse } from '../types/catalog';

export async function listBrands(): Promise<ListBrandsResponse> {
  const response = await api.get<ListBrandsResponse>('/brands');
  return response.data;
}

export async function createBrand(payload: BrandCreate): Promise<Brand> {
  const response = await api.post<Brand>('/brands', payload);
  return response.data;
}

export async function updateBrand(id: number, payload: BrandCreate): Promise<Brand> {
  const response = await api.put<Brand>(`/brands/${id}`, payload);
  return response.data;
}

export async function deleteBrand(id: number): Promise<void> {
  await api.delete(`/brands/${id}`);
}