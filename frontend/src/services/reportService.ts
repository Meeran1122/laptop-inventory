import {api} from './api';
import type {
  CurrentStockReport, LowStockReport, SalesReport, SalesTotalReport, StockInReport,
} from '../types/report';

export async function getCurrentStock(): Promise<CurrentStockReport> {
  const { data } = await api.get<CurrentStockReport>('/reports/current-stock');
  return data;
}

export async function getLowStockReport(): Promise<LowStockReport> {
  const { data } = await api.get<LowStockReport>('/reports/low-stock');
  return data;
}

export async function getStockInReport(dateFrom: string, dateTo: string): Promise<StockInReport> {
  const { data } = await api.get<StockInReport>('/reports/stock-in', {
    params: { date_from: dateFrom, date_to: dateTo },
  });
  return data;
}

export async function getSalesReport(dateFrom: string, dateTo: string): Promise<SalesReport> {
  const { data } = await api.get<SalesReport>('/reports/sales', {
    params: { date_from: dateFrom, date_to: dateTo },
  });
  return data;
}

export async function getSalesTotal(dateFrom: string, dateTo: string): Promise<SalesTotalReport> {
  const { data } = await api.get<SalesTotalReport>('/reports/sales-total', {
    params: { date_from: dateFrom, date_to: dateTo },
  });
  return data;
}