import type { LowStockItem, Sale, StockIn } from './stock';

export interface CurrentStockItem {
  product_id: number;
  name: string;
  brand_name: string;
  category_name: string;
  model: string;
  quantity: number;
  min_stock_level: number;
  purchase_price: string;
  selling_price: string;
}

export interface CurrentStockReport {
  generated_at: string;
  items: CurrentStockItem[];
  total_products: number;
  total_units: number;
  total_inventory_value: string;
}

export interface LowStockReport {
  items: LowStockItem[];
  total: number;
}

export interface StockInReport {
  date_from: string;
  date_to: string;
  items: StockIn[];
  total_records: number;
  total_units: number;
}

export interface SalesReport {
  date_from: string;
  date_to: string;
  items: Sale[];
  total_records: number;
  total_units: number;
  total_sales_amount: string;
}

export interface SalesTotalReport {
  date_from: string;
  date_to: string;
  total_sales_amount: string;
  total_sales_count: number;
  total_units_sold: number;
}