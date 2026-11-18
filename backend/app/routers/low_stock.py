from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services import history_service

router = APIRouter(prefix="/low-stock", tags=["Low Stock"])

DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get("", response_model=dict, status_code=status.HTTP_200_OK)
def list_low_stock(db: DbSession, current_user: CurrentUser) -> dict:
    items = history_service.list_low_stock(db)
    return {"items": [item.model_dump() for item in items], "total": len(items)}