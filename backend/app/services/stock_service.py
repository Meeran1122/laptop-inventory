from datetime import date
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload
from app.models.product import Product
from app.models.stock_in import StockIn
from app.models.user import User
from app.schemas.stock_in import StockInCreate, StockInOut
from decimal import Decimal
from app.models.sale import Sale
from app.schemas.sale import SaleCreate, SaleOut

MAX_STOCK_QUANTITY = 2_000_000_000


def to_stock_in_out(stock_in: StockIn, new_quantity: int | None = None) -> StockInOut:
    return StockInOut(
        id=stock_in.id,
        product_id=stock_in.product_id,
        product_name=stock_in.product.name,
        quantity=stock_in.quantity,
        purchase_price=stock_in.purchase_price,
        stock_date=stock_in.stock_date,
        notes=stock_in.notes,
        created_by=stock_in.created_by,
        created_by_name=stock_in.user.full_name,
        created_at=stock_in.created_at,
        new_quantity=new_quantity,
    )


def create_stock_in(db: Session, payload: StockInCreate, current_user: User) -> StockInOut:
    """Record incoming stock. The product row is locked so quantity updates never clash."""
    try:
        product = db.scalars(
            select(Product).where(Product.id == payload.product_id).with_for_update()
        ).first()
        if product is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
        if not product.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This product is deactivated.")
        if product.quantity + payload.quantity > MAX_STOCK_QUANTITY:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stock quantity is too large.")

        stock_in = StockIn(
            product_id=product.id,
            quantity=payload.quantity,
            purchase_price=payload.purchase_price,
            stock_date=payload.stock_date,
            notes=payload.notes,
            created_by=current_user.id,
        )
        db.add(stock_in)
        product.quantity += payload.quantity
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(stock_in)
    db.refresh(product)
    return to_stock_in_out(stock_in, new_quantity=product.quantity)


def list_stock_ins(
    db: Session,
    *,
    product_id: int | None,
    date_from: date | None,
    date_to: date | None,
    page: int,
    page_size: int,
) -> tuple[list[StockInOut], int]:
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Start date must be before end date.")

    conditions = []
    if product_id is not None:
        conditions.append(StockIn.product_id == product_id)
    if date_from is not None:
        conditions.append(StockIn.stock_date >= date_from)
    if date_to is not None:
        conditions.append(StockIn.stock_date <= date_to)

    total = db.scalar(select(func.count()).select_from(StockIn).where(*conditions)) or 0
    statement = (
        select(StockIn)
        .where(*conditions)
        .options(joinedload(StockIn.product), joinedload(StockIn.user))
        .order_by(StockIn.stock_date.desc(), StockIn.created_at.desc(), StockIn.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    records = db.scalars(statement).all()
    return [to_stock_in_out(record) for record in records], total

from app.models.sale import Sale
from app.schemas.sale import SaleCreate, SaleOut


def to_sale_out(sale: Sale, remaining_quantity: int | None = None) -> SaleOut:
    return SaleOut(
        id=sale.id,
        product_id=sale.product_id,
        product_name=sale.product.name,
        quantity=sale.quantity,
        selling_price=sale.selling_price,
        total_amount=sale.total_amount,
        sale_date=sale.sale_date,
        created_by=sale.created_by,
        created_by_name=sale.user.full_name,
        created_at=sale.created_at,
        remaining_quantity=remaining_quantity,
    )


def create_sale(db: Session, payload: SaleCreate, current_user: User) -> SaleOut:
    """Record a sale. The product row is locked so two simultaneous sales can't oversell."""
    try:
        product = db.scalars(
            select(Product).where(Product.id == payload.product_id).with_for_update()
        ).first()
        if product is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
        if not product.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This product is deactivated.")
        if product.quantity < payload.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only {product.quantity} unit(s) available.",
            )

        total_amount = (payload.quantity * payload.selling_price).quantize(Decimal("0.01"))
        sale = Sale(
            product_id=product.id,
            quantity=payload.quantity,
            selling_price=payload.selling_price,
            total_amount=total_amount,
            sale_date=payload.sale_date,
            created_by=current_user.id,
        )
        db.add(sale)
        product.quantity -= payload.quantity
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(sale)
    db.refresh(product)
    return to_sale_out(sale, remaining_quantity=product.quantity)


def list_sales(
    db: Session,
    *,
    product_id: int | None,
    date_from: date | None,
    date_to: date | None,
    page: int,
    page_size: int,
) -> tuple[list[SaleOut], int]:
    if date_from and date_to and date_from > date_to:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Start date must be before end date."
        )

    conditions = []
    if product_id is not None:
        conditions.append(Sale.product_id == product_id)
    if date_from is not None:
        conditions.append(Sale.sale_date >= date_from)
    if date_to is not None:
        conditions.append(Sale.sale_date <= date_to)

    total = db.scalar(select(func.count()).select_from(Sale).where(*conditions)) or 0
    statement = (
        select(Sale)
        .where(*conditions)
        .options(joinedload(Sale.product), joinedload(Sale.user))
        .order_by(Sale.sale_date.desc(), Sale.created_at.desc(), Sale.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    records = db.scalars(statement).all()
    return [to_sale_out(record) for record in records], total