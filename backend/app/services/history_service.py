from datetime import date

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.models.sale import Sale
from app.models.stock_in import StockIn
from app.schemas.history import HistoryItem, LowStockItem


def list_history(
    db: Session,
    *,
    product_id: int | None,
    type_filter: str | None,
    date_from: date | None,
    date_to: date | None,
    page: int,
    page_size: int,
) -> tuple[list[HistoryItem], int]:
    if date_from and date_to and date_from > date_to:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Start date must be before end date."
        )

    if type_filter not in (None, "stock_in", "sale"):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid type filter.")

    items: list[HistoryItem] = []

    # Stock-in side
    if type_filter in (None, "stock_in"):
        stmt = select(StockIn).options(joinedload(StockIn.product), joinedload(StockIn.user))
        if product_id is not None:
            stmt = stmt.where(StockIn.product_id == product_id)
        if date_from is not None:
            stmt = stmt.where(StockIn.stock_date >= date_from)
        if date_to is not None:
            stmt = stmt.where(StockIn.stock_date <= date_to)
        for row in db.scalars(stmt).all():
            items.append(
                HistoryItem(
                    type="stock_in",
                    record_id=row.id,
                    product_id=row.product_id,
                    product_name=row.product.name,
                    quantity=row.quantity,
                    unit_price=row.purchase_price,
                    total_amount=None,
                    date=row.stock_date,
                    notes=row.notes,
                    performed_by=row.created_by,
                    performed_by_name=row.user.full_name,
                    created_at=row.created_at,
                )
            )

    # Sale side
    if type_filter in (None, "sale"):
        stmt = select(Sale).options(joinedload(Sale.product), joinedload(Sale.user))
        if product_id is not None:
            stmt = stmt.where(Sale.product_id == product_id)
        if date_from is not None:
            stmt = stmt.where(Sale.sale_date >= date_from)
        if date_to is not None:
            stmt = stmt.where(Sale.sale_date <= date_to)
        for row in db.scalars(stmt).all():
            items.append(
                HistoryItem(
                    type="sale",
                    record_id=row.id,
                    product_id=row.product_id,
                    product_name=row.product.name,
                    quantity=row.quantity,
                    unit_price=row.selling_price,
                    total_amount=row.total_amount,
                    date=row.sale_date,
                    notes=None,
                    performed_by=row.created_by,
                    performed_by_name=row.user.full_name,
                    created_at=row.created_at,
                )
            )

    items.sort(key=lambda x: (x.date, x.created_at), reverse=True)
    total = len(items)
    start = (page - 1) * page_size
    return items[start : start + page_size], total


def list_low_stock(db: Session) -> list[LowStockItem]:
    stmt = (
        select(Product)
        .options(joinedload(Product.brand))
        .where(Product.is_active.is_(True))
        .where(Product.quantity < Product.min_stock_level)
        .order_by(Product.quantity.asc(), Product.name.asc())
    )
    rows = db.scalars(stmt).all()
    return [
        LowStockItem(
            id=p.id,
            name=p.name,
            brand_name=p.brand.name,
            model=p.model,
            quantity=p.quantity,
            min_stock_level=p.min_stock_level,
            status="out_of_stock" if p.quantity == 0 else "low_stock",
        )
        for p in rows
    ]