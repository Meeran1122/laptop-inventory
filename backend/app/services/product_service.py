from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, joinedload

from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product
from app.models.sale import Sale
from app.models.stock_in import StockIn
from app.models.user import User, UserRole
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate


def _serialize(product: Product) -> ProductOut:
    return ProductOut(
        id=product.id,
        name=product.name,
        brand_id=product.brand_id,
        brand_name=product.brand.name,
        category_id=product.category_id,
        category_name=product.category.name,
        model=product.model,
        processor=product.processor,
        ram=product.ram,
        storage=product.storage,
        purchase_price=product.purchase_price,
        selling_price=product.selling_price,
        quantity=product.quantity,
        min_stock_level=product.min_stock_level,
        description=product.description,
        is_active=product.is_active,
        is_low_stock=product.quantity < product.min_stock_level,
        created_at=product.created_at,
        updated_at=product.updated_at,
    )


def _verify_brand_category(db: Session, brand_id: int, category_id: int) -> None:
    if db.get(Brand, brand_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found.")
    if db.get(Category, category_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")


def _base_query():
    return select(Product).options(joinedload(Product.brand), joinedload(Product.category))


def list_products(
    db: Session,
    current_user: User,
    search: str | None,
    brand_id: int | None,
    category_id: int | None,
    include_inactive: bool,
    page: int,
    page_size: int,
) -> tuple[list[ProductOut], int]:
    stmt = _base_query()
    count_stmt = select(func.count()).select_from(Product)

    show_inactive = include_inactive and current_user.role == UserRole.admin
    if not show_inactive:
        stmt = stmt.where(Product.is_active.is_(True))
        count_stmt = count_stmt.where(Product.is_active.is_(True))

    if search:
        term = f"%{search.strip().lower()}%"
        cond = or_(func.lower(Product.name).like(term), func.lower(Product.model).like(term))
        stmt = stmt.where(cond)
        count_stmt = count_stmt.where(cond)
    if brand_id is not None:
        stmt = stmt.where(Product.brand_id == brand_id)
        count_stmt = count_stmt.where(Product.brand_id == brand_id)
    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)
        count_stmt = count_stmt.where(Product.category_id == category_id)

    total = db.scalar(count_stmt) or 0
    offset = (page - 1) * page_size
    rows = db.scalars(stmt.order_by(Product.name).offset(offset).limit(page_size)).all()
    return [_serialize(p) for p in rows], total


def get_product(db: Session, product_id: int, current_user: User) -> ProductOut:
    product = db.scalar(_base_query().where(Product.id == product_id))
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    if not product.is_active and current_user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    return _serialize(product)


def create_product(db: Session, data: ProductCreate) -> ProductOut:
    _verify_brand_category(db, data.brand_id, data.category_id)
    product = Product(
        name=data.name.strip(),
        brand_id=data.brand_id,
        category_id=data.category_id,
        model=data.model.strip(),
        processor=data.processor.strip(),
        ram=data.ram.strip(),
        storage=data.storage.strip(),
        purchase_price=data.purchase_price,
        selling_price=data.selling_price,
        quantity=0,
        min_stock_level=data.min_stock_level,
        description=data.description,
        is_active=True,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    product = db.scalar(_base_query().where(Product.id == product.id))
    return _serialize(product)


def update_product(db: Session, product_id: int, data: ProductUpdate) -> ProductOut:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    _verify_brand_category(db, data.brand_id, data.category_id)
    product.name = data.name.strip()
    product.brand_id = data.brand_id
    product.category_id = data.category_id
    product.model = data.model.strip()
    product.processor = data.processor.strip()
    product.ram = data.ram.strip()
    product.storage = data.storage.strip()
    product.purchase_price = data.purchase_price
    product.selling_price = data.selling_price
    product.min_stock_level = data.min_stock_level
    product.description = data.description
    product.is_active = data.is_active
    db.commit()
    product = db.scalar(_base_query().where(Product.id == product.id))
    return _serialize(product)


def delete_product(db: Session, product_id: int) -> None:
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")
    has_history = (
        db.scalar(select(func.count()).select_from(StockIn).where(StockIn.product_id == product_id))
        or db.scalar(select(func.count()).select_from(Sale).where(Sale.product_id == product_id))
    )
    if has_history:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This product has stock history and cannot be deleted. Deactivate it instead.",
        )
    db.delete(product)
    db.commit()