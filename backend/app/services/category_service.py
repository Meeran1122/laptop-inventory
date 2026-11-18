from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.product import Product
from app.schemas.category import CategoryCreate, CategoryUpdate


def _name_exists(db: Session, name: str, exclude_id: int | None = None) -> bool:
    stmt = select(Category).where(func.lower(Category.name) == name.lower())
    if exclude_id is not None:
        stmt = stmt.where(Category.id != exclude_id)
    return db.scalars(stmt).first() is not None


def list_categories(db: Session) -> list[Category]:
    return list(db.scalars(select(Category).order_by(Category.name)).all())


def create_category(db: Session, data: CategoryCreate) -> Category:
    name = data.name.strip()
    if _name_exists(db, name):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category name already exists.")
    category = Category(name=name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def update_category(db: Session, category_id: int, data: CategoryUpdate) -> Category:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    name = data.name.strip()
    if _name_exists(db, name, exclude_id=category.id):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category name already exists.")
    category.name = name
    db.commit()
    db.refresh(category)
    return category


def delete_category(db: Session, category_id: int) -> None:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    in_use = db.scalar(
        select(func.count()).select_from(Product).where(Product.category_id == category.id)
    ) or 0
    if in_use > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete category: it is used by {in_use} product(s).",
        )
    db.delete(category)
    db.commit()