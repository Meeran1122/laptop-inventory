from datetime import date, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product
from app.models.stock_in import StockIn
from app.models.user import User


def _make_product(db: Session, name: str = "Dell Latitude 5420", quantity: int = 5, is_active: bool = True) -> Product:
    brand = db.scalars(select(Brand).where(Brand.name == "Dell")).first()
    if brand is None:
        brand = Brand(name="Dell")
        db.add(brand)
    category = db.scalars(select(Category).where(Category.name == "Business")).first()
    if category is None:
        category = Category(name="Business")
        db.add(category)
    db.flush()
    product = Product(
        name=name,
        brand_id=brand.id,
        category_id=category.id,
        model="Latitude 5420",
        processor="Core i5 11th Gen",
        ram="8GB",
        storage="256GB SSD",
        purchase_price=Decimal("100000"),
        selling_price=Decimal("115000"),
        quantity=quantity,
        min_stock_level=2,
        is_active=is_active,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@pytest.fixture
def product(db_session: Session) -> Product:
    return _make_product(db_session)


def _payload(product_id: int, **overrides) -> dict:
    data = {"product_id": product_id, "quantity": 3, "stock_date": date.today().isoformat()}
    data.update(overrides)
    return data


def test_stock_in_increases_quantity_and_saves_history(
    client: TestClient, db_session: Session, admin_user: User, admin_headers: dict, product: Product
) -> None:
    response = client.post(
        "/api/stock-in",
        json=_payload(product.id, purchase_price=99000, notes="  First batch  "),
        headers=admin_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["new_quantity"] == 8
    assert body["quantity"] == 3
    assert body["purchase_price"] == "99000.00"
    assert body["notes"] == "First batch"
    assert body["product_name"] == "Dell Latitude 5420"
    assert body["created_by"] == admin_user.id
    assert body["created_by_name"] == "Test Admin"

    db_session.refresh(product)
    assert product.quantity == 8
    records = db_session.scalars(select(StockIn)).all()
    assert len(records) == 1
    assert records[0].created_by == admin_user.id


def test_staff_can_record_stock_in(
    client: TestClient, staff_user: User, staff_headers: dict, product: Product
) -> None:
    response = client.post("/api/stock-in", json=_payload(product.id), headers=staff_headers)
    assert response.status_code == 201
    assert response.json()["created_by_name"] == "Test Staff"


def test_purchase_price_and_notes_are_optional(client: TestClient, admin_headers: dict, product: Product) -> None:
    response = client.post("/api/stock-in", json=_payload(product.id), headers=admin_headers)
    assert response.status_code == 201
    assert response.json()["purchase_price"] is None
    assert response.json()["notes"] is None


@pytest.mark.parametrize("quantity", [0, -1, 100001])
def test_invalid_quantity_is_rejected(client: TestClient, admin_headers: dict, product: Product, quantity: int) -> None:
    response = client.post("/api/stock-in", json=_payload(product.id, quantity=quantity), headers=admin_headers)
    assert response.status_code == 422


def test_negative_purchase_price_is_rejected(client: TestClient, admin_headers: dict, product: Product) -> None:
    response = client.post("/api/stock-in", json=_payload(product.id, purchase_price=-5), headers=admin_headers)
    assert response.status_code == 422


def test_future_date_is_rejected(client: TestClient, admin_headers: dict, product: Product) -> None:
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    response = client.post("/api/stock-in", json=_payload(product.id, stock_date=tomorrow), headers=admin_headers)
    assert response.status_code == 422


def test_unknown_fields_are_rejected(client: TestClient, admin_headers: dict, product: Product) -> None:
    response = client.post("/api/stock-in", json=_payload(product.id, created_by=1), headers=admin_headers)
    assert response.status_code == 422


def test_unknown_product(client: TestClient, admin_headers: dict) -> None:
    response = client.post("/api/stock-in", json=_payload(9999), headers=admin_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Product not found."


def test_inactive_product_is_refused(client: TestClient, db_session: Session, admin_headers: dict) -> None:
    inactive = _make_product(db_session, name="Old Laptop", is_active=False)
    response = client.post("/api/stock-in", json=_payload(inactive.id), headers=admin_headers)
    assert response.status_code == 400
    assert response.json()["detail"] == "This product is deactivated."


def test_stock_in_requires_login(client: TestClient, product: Product) -> None:
    response = client.post("/api/stock-in", json=_payload(product.id))
    assert response.status_code == 401


def test_failed_stock_in_saves_nothing(
    client: TestClient, db_session: Session, admin_headers: dict, product: Product
) -> None:
    client.post("/api/stock-in", json=_payload(product.id, quantity=0), headers=admin_headers)
    db_session.refresh(product)
    assert product.quantity == 5
    assert db_session.scalars(select(StockIn)).all() == []


def test_list_is_newest_first_and_paginated(client: TestClient, admin_headers: dict, product: Product) -> None:
    today = date.today()
    for days_ago, quantity in [(3, 1), (1, 2), (2, 3)]:
        client.post(
            "/api/stock-in",
            json=_payload(product.id, quantity=quantity, stock_date=(today - timedelta(days=days_ago)).isoformat()),
            headers=admin_headers,
        )

    response = client.get("/api/stock-in", headers=admin_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 3
    assert body["page"] == 1
    assert body["page_size"] == 20
    assert [item["quantity"] for item in body["items"]] == [2, 3, 1]
    assert body["items"][0]["new_quantity"] is None

    page_two = client.get("/api/stock-in?page=2&page_size=2", headers=admin_headers).json()
    assert len(page_two["items"]) == 1
    assert page_two["total"] == 3


def test_list_filters(client: TestClient, db_session: Session, admin_headers: dict, product: Product) -> None:
    other = _make_product(db_session, name="HP EliteBook")
    today = date.today()
    client.post("/api/stock-in", json=_payload(product.id, stock_date=(today - timedelta(days=10)).isoformat()), headers=admin_headers)
    client.post("/api/stock-in", json=_payload(other.id, stock_date=today.isoformat()), headers=admin_headers)

    by_product = client.get(f"/api/stock-in?product_id={other.id}", headers=admin_headers).json()
    assert by_product["total"] == 1
    assert by_product["items"][0]["product_name"] == "HP EliteBook"

    recent = client.get(f"/api/stock-in?date_from={(today - timedelta(days=2)).isoformat()}", headers=admin_headers).json()
    assert recent["total"] == 1

    old = client.get(f"/api/stock-in?date_to={(today - timedelta(days=5)).isoformat()}", headers=admin_headers).json()
    assert old["total"] == 1


def test_list_rejects_bad_date_range(client: TestClient, admin_headers: dict) -> None:
    response = client.get("/api/stock-in?date_from=2026-11-10&date_to=2026-11-01", headers=admin_headers)
    assert response.status_code == 400
    assert response.json()["detail"] == "Start date must be before end date."


def test_staff_can_list(client: TestClient, staff_headers: dict) -> None:
    assert client.get("/api/stock-in", headers=staff_headers).status_code == 200


def test_list_requires_login(client: TestClient) -> None:
    assert client.get("/api/stock-in").status_code == 401