from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies.auth import require_admin
from app.models.user import User
from app.schemas.report import (
    CurrentStockReport, LowStockReport, SalesReport, SalesTotalReport, StockInReport,
)
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])
DbSession = Annotated[Session, Depends(get_db)]
AdminUser = Annotated[User, Depends(require_admin)]


@router.get("/current-stock", response_model=CurrentStockReport, status_code=status.HTTP_200_OK)
def get_current_stock(db: DbSession, admin: AdminUser) -> CurrentStockReport:
    return report_service.current_stock(db)


@router.get("/low-stock", response_model=LowStockReport, status_code=status.HTTP_200_OK)
def get_low_stock(db: DbSession, admin: AdminUser) -> LowStockReport:
    return report_service.low_stock(db)


@router.get("/stock-in", response_model=StockInReport, status_code=status.HTTP_200_OK)
def get_stock_in(db: DbSession, admin: AdminUser, date_from: date, date_to: date) -> StockInReport:
    return report_service.stock_in_report(db, date_from, date_to)


@router.get("/sales", response_model=SalesReport, status_code=status.HTTP_200_OK)
def get_sales(db: DbSession, admin: AdminUser, date_from: date, date_to: date) -> SalesReport:
    return report_service.sales_report(db, date_from, date_to)


@router.get("/sales-total", response_model=SalesTotalReport, status_code=status.HTTP_200_OK)
def get_sales_total(db: DbSession, admin: AdminUser, date_from: date, date_to: date) -> SalesTotalReport:
    return report_service.sales_total(db, date_from, date_to)