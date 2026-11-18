import {api} from './api';
import type { StockIn, StockInFilters, StockInPayload } from '../types/stock';
import type { Sale, SaleFilters, SalePayload } from '../types/stock';


export interface StockInListResponse {
  items: StockIn[];
  total: number;
  page: number;
  page_size: number;
}
export async function createStockIn(payload: StockInPayload): Promise<StockIn> {
  const { data } = await api.post<StockIn>('/stock-in', payload);
  return data;
}
export async function getStockIns(filters: StockInFilters = {}): Promise<StockInListResponse> {
  const { data } = await api.get<StockInListResponse>('/stock-in', { params: filters });
  return data;
}

export interface SaleListResponse {
  items: Sale[];
  total: number;
  page: number;
  page_size: number;
}
export async function createSale(payload: SalePayload): Promise<Sale> {
  const { data } = await api.post<Sale>('/sales', payload);
  return data;
}
export async function getSales(filters: SaleFilters = {}): Promise<SaleListResponse> {
  const { data } = await api.get<SaleListResponse>('/sales', { params: filters });
  return data;
}