from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel

from app.schemas.history import LowStockItem
from app.schemas.sale import SaleOut
from app.schemas.stock_in import StockInOut


class CurrentStockItem(BaseModel):
    product_id: int
    name: str
    brand_name: str
    category_name: str
    model: str
    quantity: int
    min_stock_level: int
    purchase_price: Decimal
    selling_price: Decimal


class CurrentStockReport(BaseModel):
    generated_at: datetime
    items: list[CurrentStockItem]
    total_products: int
    total_units: int
    total_inventory_value: Decimal


class LowStockReport(BaseModel):
    items: list[LowStockItem]
    total: int


class StockInReport(BaseModel):
    date_from: date
    date_to: date
    items: list[StockInOut]
    total_records: int
    total_units: int


class SalesReport(BaseModel):
    date_from: date
    date_to: date
    items: list[SaleOut]
    total_records: int
    total_units: int
    total_sales_amount: Decimal


class SalesTotalReport(BaseModel):
    date_from: date
    date_to: date
    total_sales_amount: Decimal
    total_sales_count: int
    total_units_sold: int