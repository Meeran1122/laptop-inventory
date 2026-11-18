import type { HistoryItem, LowStockItem, Sale } from './stock';

export interface DashboardCards {
  total_products: number;
  total_available_stock: number;
  low_stock_products: number;
  stock_in_records: number;
  stock_out_records: number;
}

export interface DashboardSummary {
  cards: DashboardCards;
  recent_activities: HistoryItem[];
  low_stock_products: LowStockItem[];
  recent_sales: Sale[];
}