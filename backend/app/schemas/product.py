from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    brand_id: int
    category_id: int
    model: str = Field(min_length=1, max_length=100)
    processor: str = Field(min_length=1, max_length=100)
    ram: str = Field(min_length=1, max_length=50)
    storage: str = Field(min_length=1, max_length=50)
    purchase_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    selling_price: Decimal = Field(ge=0, max_digits=12, decimal_places=2)
    min_stock_level: int = Field(ge=0)
    description: str | None = Field(default=None, max_length=1000)

    model_config = ConfigDict(extra="forbid")


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    is_active: bool = True


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    brand_id: int
    brand_name: str
    category_id: int
    category_name: str
    model: str
    processor: str
    ram: str
    storage: str
    purchase_price: Decimal
    selling_price: Decimal
    quantity: int
    min_stock_level: int
    description: str | None
    is_active: bool
    is_low_stock: bool
    created_at: datetime
    updated_at: datetime