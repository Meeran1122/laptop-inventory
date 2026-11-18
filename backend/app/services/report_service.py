from datetime import date, datetime, timezone
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.models.sale import Sale
from app.models.stock_in import StockIn
from app.schemas.report import (
    CurrentStockItem, CurrentStockReport, LowStockReport,
    SalesReport, SalesTotalReport, StockInReport,
)
from app.services.history_service import list_low_stock
from app.services.stock_service import to_sale_out, to_stock_in_out


def _validate_range(date_from: date, date_to: date) -> None:
    if date_from > date_to:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Start date must be before end date."
        )


def current_stock(db: Session) -> CurrentStockReport:
    stmt = (
        select(Product)
        .options(joinedload(Product.brand), joinedload(Product.category))
        .where(Product.is_active.is_(True))
        .order_by(Product.name)
    )
    products = db.scalars(stmt).all()

    items = [
        CurrentStockItem(
            product_id=p.id, name=p.name, brand_name=p.brand.name,
            category_name=p.category.name, model=p.model,
            quantity=p.quantity, min_stock_level=p.min_stock_level,
            purchase_price=p.purchase_price, selling_price=p.selling_price,
        )
        for p in products
    ]
    total_units = sum(p.quantity for p in products)
    total_value = sum((p.purchase_price * p.quantity for p in products), Decimal("0.00"))

    return CurrentStockReport(
        generated_at=datetime.now(timezone.utc),
        items=items, total_products=len(items),
        total_units=total_units, total_inventory_value=total_value,
    )


def low_stock(db: Session) -> LowStockReport:
    items = list_low_stock(db)
    return LowStockReport(items=items, total=len(items))


def stock_in_report(db: Session, date_from: date, date_to: date) -> StockInReport:
    _validate_range(date_from, date_to)
    stmt = (
        select(StockIn)
        .options(joinedload(StockIn.product), joinedload(StockIn.user))
        .where(StockIn.stock_date >= date_from, StockIn.stock_date <= date_to)
        .order_by(StockIn.stock_date.desc(), StockIn.created_at.desc())
    )
    rows = db.scalars(stmt).all()
    items = [to_stock_in_out(r) for r in rows]
    return StockInReport(
        date_from=date_from, date_to=date_to, items=items,
        total_records=len(items), total_units=sum(i.quantity for i in items),
    )


def sales_report(db: Session, date_from: date, date_to: date) -> SalesReport:
    _validate_range(date_from, date_to)
    stmt = (
        select(Sale)
        .options(joinedload(Sale.product), joinedload(Sale.user))
        .where(Sale.sale_date >= date_from, Sale.sale_date <= date_to)
        .order_by(Sale.sale_date.desc(), Sale.created_at.desc())
    )
    rows = db.scalars(stmt).all()
    items = [to_sale_out(r) for r in rows]
    total_amount = sum((s.total_amount for s in items), Decimal("0.00"))
    return SalesReport(
        date_from=date_from, date_to=date_to, items=items,
        total_records=len(items), total_units=sum(i.quantity for i in items),
        total_sales_amount=total_amount,
    )


def sales_total(db: Session, date_from: date, date_to: date) -> SalesTotalReport:
    _validate_range(date_from, date_to)
    total_amount = db.scalar(
        select(func.coalesce(func.sum(Sale.total_amount), 0))
        .where(Sale.sale_date >= date_from, Sale.sale_date <= date_to)
    ) or Decimal("0.00")
    count = db.scalar(
        select(func.count()).select_from(Sale)
        .where(Sale.sale_date >= date_from, Sale.sale_date <= date_to)
    ) or 0
    units = db.scalar(
        select(func.coalesce(func.sum(Sale.quantity), 0))
        .where(Sale.sale_date >= date_from, Sale.sale_date <= date_to)
    ) or 0

    return SalesTotalReport(
        date_from=date_from, date_to=date_to,
        total_sales_amount=total_amount,
        total_sales_count=int(count), total_units_sold=int(units),
    )