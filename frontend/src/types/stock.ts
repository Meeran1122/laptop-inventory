export interface StockIn {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  purchase_price: string | null;
  stock_date: string;
  notes: string | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
  new_quantity: number | null;
}
export interface StockInPayload {
  product_id: number;
  quantity: number;
  purchase_price?: number;
  stock_date: string;
  notes?: string;
}
export interface StockInFilters {
  product_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface Sale {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  selling_price: string;
  total_amount: string;
  sale_date: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  remaining_quantity: number | null;
}
export interface SalePayload {
  product_id: number;
  quantity: number;
  selling_price: number;
  sale_date: string;
}
export interface SaleFilters {
  product_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}

export interface HistoryItem {
  type: 'stock_in' | 'sale';
  record_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: string | null;
  total_amount: string | null;
  date: string;
  notes: string | null;
  performed_by: number;
  performed_by_name: string;
  created_at: string;
}
export interface LowStockItem {
  id: number;
  name: string;
  brand_name: string;
  model: string;
  quantity: number;
  min_stock_level: number;
  status: 'low_stock' | 'out_of_stock';
}
export interface HistoryFilters {
  product_id?: number;
  type?: 'stock_in' | 'sale';
  date_from?: string;
  date_to?: string;
  page?: number;
  page_size?: number;
}
export interface HistoryListResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  page_size: number;
}
export interface LowStockListResponse {
  items: LowStockItem[];
  total: number;
}