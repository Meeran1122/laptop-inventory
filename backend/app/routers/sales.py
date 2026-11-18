from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.sale import SaleCreate, SaleOut
from app.services import stock_service

router = APIRouter(prefix="/sales", tags=["Sales"])

DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.post("", response_model=SaleOut, status_code=status.HTTP_201_CREATED)
def create_sale(payload: SaleCreate, db: DbSession, current_user: CurrentUser) -> SaleOut:
    return stock_service.create_sale(db, payload, current_user)


@router.get("", response_model=dict, status_code=status.HTTP_200_OK)
def list_sales(
    db: DbSession,
    current_user: CurrentUser,
    product_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> dict:
    items, total = stock_service.list_sales(
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