from datetime import date, timedelta
from decimal import Decimal

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.brand import Brand
from app.models.category import Category
from app.models.product import Product
from app.models.sale import Sale
from app.models.user import User


def _make_product(db: Session, name: str = "Dell Latitude 5420", quantity: int = 10, is_active: bool = True) -> Product:
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
        name=name, brand_id=brand.id, category_id=category.id,
        model="Latitude 5420", processor="Core i5", ram="8GB", storage="256GB SSD",
        purchase_price=Decimal("100000"), selling_price=Decimal("115000"),
        quantity=quantity, min_stock_level=2, is_active=is_active,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@pytest.fixture
def product(db_session: Session) -> Product:
    return _make_product(db_session)


def _payload(product_id: int, **overrides) -> dict:
    data = {
        "product_id": product_id,
        "quantity": 2,
        "selling_price": "115000.00",
        "sale_date": date.today().isoformat(),
    }
    data.update(overrides)
    return data


def test_sale_decreases_quantity_and_saves_history(
    client: TestClient, db_session: Session, admin_user: User, admin_headers: dict, product: Product
) -> None:
    response = client.post("/api/sales", json=_payload(product.id), headers=admin_headers)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["remaining_quantity"] == 8
    assert body["quantity"] == 2
    assert body["selling_price"] == "115000.00"
    assert body["total_amount"] == "230000.00"
    assert body["created_by"] == admin_user.id

    db_session.refresh(product)
    assert product.quantity == 8
    sales = db_session.scalars(select(Sale)).all()
    assert len(sales) == 1
    assert sales[0].total_amount == Decimal("230000.00")


def test_staff_can_record_sale(client: TestClient, staff_user: User, staff_headers: dict, product: Product) -> None:
    response = client.post("/api/sales", json=_payload(product.id), headers=staff_headers)
    assert response.status_code == 201
    assert response.json()["created_by_name"] == "Test Staff"


def test_overselling_is_blocked(client: TestClient, admin_headers: dict, product: Product) -> None:
    response = client.post("/api/sales", json=_payload(product.id, quantity=20), headers=admin_headers)
    assert response.status_code == 400
    assert response.json()["detail"] == "Only 10 unit(s) available."


def test_exact_stock_can_be_sold(client: TestClient, db_session: Session, admin_headers: dict, product: Product) -> None:
    response = client.post("/api/sales", json=_payload(product.id, quantity=10), headers=admin_headers)
    assert response.status_code == 201
    assert response.json()["remaining_quantity"] == 0
    db_session.refresh(product)
    assert product.quantity == 0


def test_price_snapshot_kept_after_product_price_changes(
    client: TestClient, db_session: Session, admin_headers: dict, product: Product
) -> None:
    response = client.post("/api/sales", json=_payload(product.id, selling_price="120000.00"), headers=admin_headers)
    assert response.status_code == 201
    assert response.json()["selling_price"] == "120000.00"

    product.selling_price = Decimal("130000.00")
    db_session.commit()

    sale = db_session.scalars(select(Sale)).first()
    assert sale.selling_price == Decimal("120000.00")
    assert sale.total_amount == Decimal("240000.00")


@pytest.mark.parametrize("quantity", [0, -1, 100001])
def test_invalid_quantity_rejected(client: TestClient, admin_headers: dict, product: Product, quantity: int) -> None:
    response = client.post("/api/sales", json=_payload(product.id, quantity=quantity), headers=admin_headers)
    assert response.status_code == 422


def test_future_date_rejected(client: TestClient, admin_headers: dict, product: Product) -> None:
    tomorrow = (date.today() + timedelta(days=1)).isoformat()
    response = client.post("/api/sales", json=_payload(product.id, sale_date=tomorrow), headers=admin_headers)
    assert response.status_code == 422


def test_unknown_fields_rejected(client: TestClient, admin_headers: dict, product: Product) -> None:
    response = client.post("/api/sales", json=_payload(product.id, created_by=99), headers=admin_headers)
    assert response.status_code == 422


def test_unknown_product(client: TestClient, admin_headers: dict) -> None:
    response = client.post("/api/sales", json=_payload(9999), headers=admin_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Product not found."


def test_inactive_product_refused(client: TestClient, db_session: Session, admin_headers: dict) -> None:
    inactive = _make_product(db_session, name="Old Laptop", is_active=False)
    response = client.post("/api/sales", json=_payload(inactive.id), headers=admin_headers)
    assert response.status_code == 400
    assert response.json()["detail"] == "This product is deactivated."


def test_sale_requires_login(client: TestClient, product: Product) -> None:
    assert client.post("/api/sales", json=_payload(product.id)).status_code == 401


def test_failed_sale_saves_nothing(client: TestClient, db_session: Session, admin_headers: dict, product: Product) -> None:
    client.post("/api/sales", json=_payload(product.id, quantity=999), headers=admin_headers)
    db_session.refresh(product)
    assert product.quantity == 10
    assert db_session.scalars(select(Sale)).all() == []


def test_list_is_newest_first_and_paginated(client: TestClient, admin_headers: dict, product: Product) -> None:
    today = date.today()
    for days_ago, qty in [(3, 1), (1, 2), (2, 3)]:
        client.post(
            "/api/sales",
            json=_payload(product.id, quantity=qty, sale_date=(today - timedelta(days=days_ago)).isoformat()),
            headers=admin_headers,
        )

    body = client.get("/api/sales", headers=admin_headers).json()
    assert body["total"] == 3
    assert [item["quantity"] for item in body["items"]] == [2, 3, 1]
    assert body["items"][0]["remaining_quantity"] is None


def test_list_filters(client: TestClient, db_session: Session, admin_headers: dict, product: Product) -> None:
    other = _make_product(db_session, name="HP EliteBook")
    today = date.today()
    client.post("/api/sales", json=_payload(product.id, sale_date=(today - timedelta(days=10)).isoformat()), headers=admin_headers)
    client.post("/api/sales", json=_payload(other.id, sale_date=today.isoformat()), headers=admin_headers)

    by_product = client.get(f"/api/sales?product_id={other.id}", headers=admin_headers).json()
    assert by_product["total"] == 1
    assert by_product["items"][0]["product_name"] == "HP EliteBook"


def test_list_rejects_bad_date_range(client: TestClient, admin_headers: dict) -> None:
    response = client.get("/api/sales?date_from=2026-11-10&date_to=2026-11-01", headers=admin_headers)
    assert response.status_code == 400
    assert response.json()["detail"] == "Start date must be before end date."


def test_staff_can_list(client: TestClient, staff_headers: dict) -> None:
    assert client.get("/api/sales", headers=staff_headers).status_code == 200


def test_list_requires_login(client: TestClient) -> None:
    assert client.get("/api/sales").status_code == 401