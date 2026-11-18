from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user, require_admin
from app.models.user import User
from app.schemas.brand import BrandCreate, BrandOut, BrandUpdate
from app.services import brand_service

router = APIRouter(prefix="/brands", tags=["Brands"])


@router.get("", response_model=dict, status_code=status.HTTP_200_OK)
def list_brands(
    db: Annotated[Session, Depends(get_db)],
    _current_user: Annotated[User, Depends(get_current_user)],
) -> dict:
    brands = brand_service.list_brands(db)
    return {"items": [BrandOut.model_validate(b) for b in brands], "total": len(brands)}


@router.post("", response_model=BrandOut, status_code=status.HTTP_201_CREATED)
def create_brand(
    payload: BrandCreate,
    db: Annotated[Session, Depends(get_db)],
    _current_admin: Annotated[User, Depends(require_admin)],
) -> dict:
    return brand_service.create_brand(db, payload)


@router.put("/{brand_id}", response_model=BrandOut, status_code=status.HTTP_200_OK)
def update_brand(
    brand_id: int,
    payload: BrandUpdate,
    db: Annotated[Session, Depends(get_db)],
    _current_admin: Annotated[User, Depends(require_admin)],
):
    return brand_service.update_brand(db, brand_id, payload)


@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brand(
    brand_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_admin: Annotated[User, Depends(require_admin)],
) -> None:
    brand_service.delete_brand(db, brand_id)