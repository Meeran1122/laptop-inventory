from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class SaleCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    product_id: int
    quantity: int = Field(ge=1, le=100000)
    selling_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    sale_date: date

    @field_validator("sale_date")
    @classmethod
    def sale_date_not_in_future(cls, value: date) -> date:
        if value > date.today():
            raise ValueError("Sale date cannot be in the future.")
        return value


class SaleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    product_name: str
    quantity: int
    selling_price: Decimal
    total_amount: Decimal
    sale_date: date
    created_by: int
    created_by_name: str
    created_at: datetime
    remaining_quantity: int | None = None