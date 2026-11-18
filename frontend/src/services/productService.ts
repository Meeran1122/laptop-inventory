import {api} from './api';
import type { ListProductsResponse, Product, ProductPayload } from '../types/product';

export async function listProducts(params?: {
  search?: string;
  brand_id?: number;
  category_id?: number;
  include_inactive?: boolean;
  page?: number;
  page_size?: number;
}): Promise<ListProductsResponse> {
  const response = await api.get<ListProductsResponse>('/products', { params });
  return response.data;
}

export async function getProduct(id: number): Promise<Product> {
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const response = await api.post<Product>('/products', payload);
  return response.data;
}

export async function updateProduct(id: number, payload: ProductPayload): Promise<Product> {
  const response = await api.put<Product>(`/products/${id}`, payload);
  return response.data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function getAllActiveProducts(): Promise<Product[]> {
  const products: Product[] = [];
  for (let page = 1; ; page += 1) {
    const response = await listProducts({ page, page_size: 100 });
    products.push(...response.items);
    if (response.items.length === 0 || products.length >= response.total) return products;
  }
}