export interface Brand {
  id: number;
  name: string;
  created_at: string;
}

export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export interface ListBrandsResponse {
  items: Brand[];
  total: number;
}

export interface ListCategoriesResponse {
  items: Category[];
  total: number;
}

export interface BrandCreate { name: string; }
export interface CategoryCreate { name: string; }