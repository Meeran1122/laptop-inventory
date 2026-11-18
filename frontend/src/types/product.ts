export interface Product {
  id: number;
  name: string;
  brand_id: number;
  brand_name: string;
  category_id: number;
  category_name: string;
  model: string;
  processor: string;
  ram: string;
  storage: string;
  purchase_price: string;
  selling_price: string;
  quantity: number;
  min_stock_level: number;
  description: string | null;
  is_active: boolean;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductPayload {
  name: string;
  brand_id: number;
  category_id: number;
  model: string;
  processor: string;
  ram: string;
  storage: string;
  purchase_price: number;
  selling_price: number;
  min_stock_level: number;
  description?: string | null;
  is_active?: boolean;
}

export interface ListProductsResponse {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
}