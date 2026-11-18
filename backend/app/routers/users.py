from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_staff(
    payload: UserCreate,
    db: Annotated[Session, Depends(get_db)],
    _current_admin: Annotated[User, Depends(require_admin)],
) -> User:
    return user_service.create_staff(db, payload)


@router.get("", response_model=dict, status_code=status.HTTP_200_OK)
def list_users(
    db: Annotated[Session, Depends(get_db)],
    _current_admin: Annotated[User, Depends(require_admin)],
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    search: str | None = Query(default=None),
) -> dict:
    users, total = user_service.list_users(db, page, page_size, search)
    return {
        "items": [UserOut.model_validate(u) for u in users],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{user_id}", response_model=UserOut, status_code=status.HTTP_200_OK)
def get_user(
    user_id: int,
    db: Annotated[Session, Depends(get_db)],
    _current_admin: Annotated[User, Depends(require_admin)],
) -> User:
    return user_service.get_user_or_404(db, user_id)


@router.put("/{user_id}", response_model=UserOut, status_code=status.HTTP_200_OK)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[User, Depends(require_admin)],
) -> User:
    return user_service.update_user(db, user_id, payload, current_admin)