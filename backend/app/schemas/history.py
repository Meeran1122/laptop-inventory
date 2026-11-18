from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel


class HistoryItem(BaseModel):
    type: Literal["stock_in", "sale"]
    record_id: int
    product_id: int
    product_name: str
    quantity: int
    unit_price: Decimal | None
    total_amount: Decimal | None
    date: date
    notes: str | None
    performed_by: int
    performed_by_name: str
    created_at: datetime


class LowStockItem(BaseModel):
    id: int
    name: str
    brand_name: str
    model: str
    quantity: int
    min_stock_level: int
    status: Literal["low_stock", "out_of_stock"]