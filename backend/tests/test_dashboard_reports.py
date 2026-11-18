from datetime import date, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product


def _make_product(db: Session, name: str, qty: int, purchase: str, selling: str) -> Product:
    brand = db.scalars(select(Brand).where(Brand.name == "Dell")).first() or Brand(name="Dell")
    db.add(brand)
    cat = db.scalars(select(Category).where(Category.name == "Business")).first() or Category(name="Business")
    db.add(cat)
    db.flush()
    p = Product(
        name=name, brand_id=brand.id, category_id=cat.id,
        model="M1", processor="i5", ram="8GB", storage="256GB",
        purchase_price=Decimal(purchase), selling_price=Decimal(selling),
        quantity=qty, min_stock_level=2, is_active=True,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def test_dashboard_summary(client: TestClient, admin_headers: dict, db_session: Session) -> None:
    _make_product(db_session, "Laptop A", 5, "100000", "115000")
    _make_product(db_session, "Laptop B", 0, "80000", "95000")

    body = client.get("/api/dashboard/summary", headers=admin_headers).json()
    assert body["cards"]["total_products"] == 2
    assert body["cards"]["total_available_stock"] == 5
    assert body["cards"]["low_stock_products"] == 1  # Laptop B: 0 < 2


def test_dashboard_staff_allowed(client: TestClient, staff_headers: dict) -> None:
    assert client.get("/api/dashboard/summary", headers=staff_headers).status_code == 200


def test_reports_blocked_for_staff(client: TestClient, staff_headers: dict) -> None:
    for path in (
        "/api/reports/current-stock",
        "/api/reports/low-stock",
        "/api/reports/sales-total?date_from=2026-01-01&date_to=2026-12-31",
    ):
        assert client.get(path, headers=staff_headers).status_code == 403


def test_current_stock_report(client: TestClient, admin_headers: dict, db_session: Session) -> None:
    _make_product(db_session, "Laptop A", 5, "100000", "115000")
    body = client.get("/api/reports/current-stock", headers=admin_headers).json()
    assert body["total_products"] == 1
    assert body["total_units"] == 5
    assert Decimal(body["total_inventory_value"]) == Decimal("500000.00")


def test_sales_report_and_totals(client: TestClient, admin_headers: dict, db_session: Session) -> None:
    p = _make_product(db_session, "Laptop A", 10, "100000", "115000")
    today = date.today()
    client.post("/api/sales", json={
        "product_id": p.id, "quantity": 2, "selling_price": "115000.00",
        "sale_date": today.isoformat(),
    }, headers=admin_headers)

    body = client.get(
        f"/api/reports/sales?date_from={today.isoformat()}&date_to={today.isoformat()}",
        headers=admin_headers,
    ).json()
    assert body["total_records"] == 1
    assert body["total_units"] == 2
    assert Decimal(body["total_sales_amount"]) == Decimal("230000.00")

    total = client.get(
        f"/api/reports/sales-total?date_from={today.isoformat()}&date_to={today.isoformat()}",
        headers=admin_headers,
    ).json()
    assert total["total_sales_count"] == 1
    assert total["total_units_sold"] == 2


def test_sales_report_bad_range(client: TestClient, admin_headers: dict) -> None:
    response = client.get(
        "/api/reports/sales?date_from=2026-11-10&date_to=2026-11-01",
        headers=admin_headers,
    )
    assert response.status_code == 400