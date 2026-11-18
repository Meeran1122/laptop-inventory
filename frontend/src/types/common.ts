export interface ListResponse<T> {
  items: T[];
  total: number;
}

export interface PaginatedResponse<T> extends ListResponse<T> {
  page: number;
  page_size: number;
}

export interface ValidationErrorItem {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface ApiError {
  detail: string | ValidationErrorItem[];
}
