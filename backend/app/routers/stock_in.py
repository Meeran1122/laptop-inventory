from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.stock_in import StockInCreate, StockInOut
from app.services import stock_service

router = APIRouter(prefix="/stock-in", tags=["Stock In"])

DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post("", response_model=StockInOut, status_code=status.HTTP_201_CREATED)
def create_stock_in(payload: StockInCreate, db: DbSession, current_user: CurrentUser) -> StockInOut:
    return stock_service.create_stock_in(db, payload, current_user)


@router.get("", response_model=dict, status_code=status.HTTP_200_OK)
def list_stock_ins(
    db: DbSession,
    current_user: CurrentUser,
    product_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> dict:
    items, total = stock_service.list_stock_ins(
        db,
        product_id=product_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )
    return {
        "items": [item.model_dump() for item in items],
        "total": total,
        "page": page,
        "page_size": page_size,
    }