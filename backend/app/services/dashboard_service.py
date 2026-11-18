from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.models.sale import Sale
from app.models.stock_in import StockIn
from app.schemas.dashboard import DashboardCards, DashboardSummary
from app.services.history_service import list_history, list_low_stock
from app.services.stock_service import to_sale_out


def get_summary(db: Session) -> DashboardSummary:
    # Cards
    total_products = db.scalar(
        select(func.count()).select_from(Product).where(Product.is_active.is_(True))
    ) or 0

    total_available_stock = db.scalar(
        select(func.coalesce(func.sum(Product.quantity), 0))
        .select_from(Product)
        .where(Product.is_active.is_(True))
    ) or 0

    low_stock_products = db.scalar(
        select(func.count())
        .select_from(Product)
        .where(Product.is_active.is_(True))
        .where(Product.quantity < Product.min_stock_level)
    ) or 0

    stock_in_records = db.scalar(select(func.count()).select_from(StockIn)) or 0
    stock_out_records = db.scalar(select(func.count()).select_from(Sale)) or 0

    cards = DashboardCards(
        total_products=int(total_products),
        total_available_stock=int(total_available_stock),
        low_stock_products=int(low_stock_products),
        stock_in_records=int(stock_in_records),
        stock_out_records=int(stock_out_records),
    )

    # Recent activities (10)
    recent_activities, _ = list_history(
        db,
        product_id=None,
        type_filter=None,
        date_from=None,
        date_to=None,
        page=1,
        page_size=10,
    )

    # Low stock (5)
    low_stock = list_low_stock(db)[:5]

    # Recent sales (5)
    sale_stmt = (
        select(Sale)
        .options(joinedload(Sale.product), joinedload(Sale.user))
        .order_by(Sale.sale_date.desc(), Sale.created_at.desc(), Sale.id.desc())
        .limit(5)
    )
    recent_sales = [to_sale_out(s) for s in db.scalars(sale_stmt).all()]

    return DashboardSummary(
        cards=cards,
        recent_activities=recent_activities,
        low_stock_products=low_stock,
        recent_sales=recent_sales,
    )