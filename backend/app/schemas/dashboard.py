from pydantic import BaseModel

from app.schemas.history import HistoryItem, LowStockItem
from app.schemas.sale import SaleOut

class DashboardCards(BaseModel):
    total_products: int
    total_available_stock: int
    low_stock_products: int
    stock_in_records: int
    stock_out_records: int

class DashboardSummary(BaseModel):
    cards: DashboardCards
    recent_activities: list[HistoryItem]
    low_stock_products: list[LowStockItem]
    recent_sales: list[SaleOut]