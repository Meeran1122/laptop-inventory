import {api} from './api';
import type { HistoryFilters, HistoryListResponse, LowStockListResponse } from '../types/stock';

export async function getHistory(filters: HistoryFilters = {}): Promise<HistoryListResponse> {
  const { data } = await api.get<HistoryListResponse>('/history', { params: filters });
  return data;
}

export async function getLowStock(): Promise<LowStockListResponse> {
  const { data } = await api.get<LowStockListResponse>('/low-stock');
  return data;
}