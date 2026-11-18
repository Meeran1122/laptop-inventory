from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class StockInCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: int
    quantity: int = Field(ge=1, le=100000)
    purchase_price: Decimal | None = Field(default=None, ge=0, max_digits=12, decimal_places=2)
    stock_date: date
    notes: str | None = Field(default=None, max_length=500)

    @field_validator("stock_date")
    @classmethod
    def stock_date_not_in_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("Stock date cannot be in the future.")
        return value

    @field_validator("notes")
    @classmethod
    def clean_notes(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None


class StockInOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: str
    quantity: int
    purchase_price: Decimal | None
    stock_date: date
    notes: str | None
    created_by: int
    created_by_name: str
    created_at: datetime
    new_quantity: int | None = None