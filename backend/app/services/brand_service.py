from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.brand import Brand
from app.models.product import Product
from app.schemas.brand import BrandCreate, BrandUpdate


def _name_exists(db: Session, name: str, exclude_id: int | None = None) -> bool:
    stmt = select(Brand).where(func.lower(Brand.name) == name.lower())
    if exclude_id is not None:
        stmt = stmt.where(Brand.id != exclude_id)
    return db.scalars(stmt).first() is not None


def list_brands(db: Session) -> list[Brand]:
    return list(db.scalars(select(Brand).order_by(Brand.name)).all())


def create_brand(db: Session, data: BrandCreate) -> Brand:
    name = data.name.strip()
    if _name_exists(db, name):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Brand name already exists.")
    brand = Brand(name=name)
    db.add(brand)
    db.commit()
    db.refresh(brand)
    return brand


def update_brand(db: Session, brand_id: int, data: BrandUpdate) -> Brand:
    brand = db.get(Brand, brand_id)
    if brand is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found.")
    name = data.name.strip()
    if _name_exists(db, name, exclude_id=brand.id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Brand name already exists.")
    brand.name = name
    db.commit()
    db.refresh(brand)
    return brand


def delete_brand(db: Session, brand_id: int) -> None:
    brand = db.get(Brand, brand_id)
    if brand is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found.")
    in_use = db.scalar(select(func.count()).select_from(Product).where(Product.brand_id == brand.id)) or 0
    if in_use > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete brand: it is used by {in_use} product(s).",
        )
    db.delete(brand)
    db.commit()