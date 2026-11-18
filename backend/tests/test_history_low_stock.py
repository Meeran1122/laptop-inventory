from datetime import date, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product


def _make_product(db: Session, name: str, quantity: int, min_stock: int, is_active: bool = True) -> Product:
    brand = db.scalars(select(Brand).where(Brand.name == "Dell")).first()
    if brand is None:
        brand = Brand(name="Dell")
        db.add(brand)
    cat = db.scalars(select(Category).where(Category.name == "Business")).first()
    if cat is None:
        cat = Category(name="Business")
        db.add(cat)
    db.flush()
    p = Product(
        name=name, brand_id=brand.id, category_id=cat.id,
        model="M1", processor="i5", ram="8GB", storage="256GB",
        purchase_price=Decimal("100000"), selling_price=Decimal("115000"),
        quantity=quantity, min_stock_level=min_stock, is_active=is_active,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def test_history_merges_and_orders(client: TestClient, db_session: Session, admin_headers: dict) -> None:
    product = _make_product(db_session, "Dell XPS", 10, 2)
    today = date.today()

    client.post("/api/stock-in", json={
        "product_id": product.id, "quantity": 5,
        "stock_date": (today - timedelta(days=2)).isoformat(),
    }, headers=admin_headers)

    client.post("/api/sales", json={
        "product_id": product.id, "quantity": 1, "selling_price": "115000.00",
        "sale_date": today.isoformat(),
    }, headers=admin_headers)

    body = client.get("/api/history", headers=admin_headers).json()
    assert body["total"] == 2
    assert body["items"][0]["type"] == "sale"
    assert body["items"][1]["type"] == "stock_in"


def test_history_type_filter(client: TestClient, db_session: Session, admin_headers: dict) -> None:
    product = _make_product(db_session, "Dell XPS", 10, 2)
    client.post("/api/stock-in", json={
        "product_id": product.id, "quantity": 5, "stock_date": date.today().isoformat(),
    }, headers=admin_headers)

    only_sales = client.get("/api/history?type=sale", headers=admin_headers).json()
    assert only_sales["total"] == 0

    only_stock = client.get("/api/history?type=stock_in", headers=admin_headers).json()
    assert only_stock["total"] == 1


def test_history_invalid_type(client: TestClient, admin_headers: dict) -> None:
    response = client.get("/api/history?type=bogus", headers=admin_headers)
    assert response.status_code == 422


def test_history_bad_date_range(client: TestClient, admin_headers: dict) -> None:
    response = client.get("/api/history?date_from=2026-11-10&date_to=2026-11-01", headers=admin_headers)
    assert response.status_code == 400


def test_history_requires_login(client: TestClient) -> None:
    assert client.get("/api/history").status_code == 401


def test_low_stock_boundary_not_low(client: TestClient, db_session: Session, admin_headers: dict) -> None:
    # qty == min_stock → NOT low
    _make_product(db_session, "Boundary Laptop", quantity=3, min_stock=3)
    body = client.get("/api/low-stock", headers=admin_headers).json()
    assert body["total"] == 0


def test_low_stock_includes_zero_and_ignores_inactive(client: TestClient, db_session: Session, admin_headers: dict) -> None:
    _make_product(db_session, "Low Laptop", quantity=1, min_stock=3)
    _make_product(db_session, "Out Laptop", quantity=0, min_stock=3)
    _make_product(db_session, "Inactive Laptop", quantity=0, min_stock=3, is_active=False)

    body = client.get("/api/low-stock", headers=admin_headers).json()
    assert body["total"] == 2
    names = {item["name"] for item in body["items"]}
    assert names == {"Low Laptop", "Out Laptop"}
    statuses = {item["status"] for item in body["items"]}
    assert statuses == {"low_stock", "out_of_stock"}


def test_low_stock_requires_login(client: TestClient) -> None:
    assert client.get("/api/low-stock").status_code == 401