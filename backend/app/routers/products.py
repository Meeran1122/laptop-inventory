from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.user import User
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate
from app.services import product_service

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=dict, status_code=status.HTTP_200_OK)
def list_products(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    search: str | None = Query(default=None),
    brand_id: int | None = Query(default=None),
    category_id: int | None = Query(default=None),
    include_inactive: bool = Query(default=False),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> dict:
    items, total = product_service.list_products(
        db, current_user, search, brand_id, category_id, include_inactive, page, page_size
    )
    return {
        "items": [item.model_dump() for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{product_id}", response_model=ProductOut, status_code=status.HTTP_200_OK)
def get_product(
    product_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProductOut:
    return product_service.get_product(db, product_id, current_user)


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Annotated[Session, Depends(get_db)],
    _current_admin: Annotated[User, Depends(require_admin)],
) -> ProductOut:
    return product_service.create_product(db, payload)


@router.put("/{product_id}", response_model=ProductOut, status_code=status.HTTP_200_OK)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Annotated[Session, Depends(get_db)],
    _current_admin: Annotated[User, Depends(require_admin)],
) -> ProductOut:
    return product_service.update_product(db, product_id, payload)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_admin: Annotated[User, Depends(require_admin)],
) -> None:
    product_service.delete_product(db, product_id)