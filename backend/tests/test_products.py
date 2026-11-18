from decimal import Decimal

from fastapi.testclient import TestClient


def _product_payload(brand_id: int, category_id: int, **overrides) -> dict:
    base = {
        "name": "Dell Latitude 5420",
        "brand_id": brand_id,
        "category_id": category_id,
        "model": "Latitude 5420",
        "processor": "Core i5",
        "ram": "8GB",
        "storage": "256GB SSD",
        "purchase_price": "100000.00",
        "selling_price": "115000.00",
        "min_stock_level": 2,
    }
    base.update(overrides)
    return base


def _make_brand_category(client, headers):
    brand = client.post("/api/brands", json={"name": "Dell"}, headers=headers).json()
    category = client.post("/api/categories", json={"name": "Business"}, headers=headers).json()
    return brand["id"], category["id"]


def test_create_product(client: TestClient, admin_headers: dict) -> None:
    brand_id, category_id = _make_brand_category(client, admin_headers)
    response = client.post("/api/products", json=_product_payload(brand_id, category_id), headers=admin_headers)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["quantity"] == 0
    assert body["is_low_stock"] is True  # 0 < 2
    assert body["brand_name"] == "Dell"
    assert body["category_name"] == "Business"


def test_create_product_rejects_quantity(client: TestClient, admin_headers: dict) -> None:
    brand_id, category_id = _make_brand_category(client, admin_headers)
    payload = _product_payload(brand_id, category_id, quantity=10)
    response = client.post("/api/products", json=payload, headers=admin_headers)
    assert response.status_code == 422


def test_create_product_brand_not_found(client: TestClient, admin_headers: dict) -> None:
    _, category_id = _make_brand_category(client, admin_headers)
    payload = _product_payload(99999, category_id)
    response = client.post("/api/products", json=payload, headers=admin_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "Brand not found."


def test_create_product_requires_admin(client: TestClient, admin_headers: dict, staff_headers: dict) -> None:
    brand_id, category_id = _make_brand_category(client, admin_headers)
    response = client.post(
        "/api/products", json=_product_payload(brand_id, category_id), headers=staff_headers
    )
    assert response.status_code == 403


def test_list_products_search(client: TestClient, admin_headers: dict) -> None:
    brand_id, category_id = _make_brand_category(client, admin_headers)
    client.post("/api/products", json=_product_payload(brand_id, category_id), headers=admin_headers)
    response = client.get("/api/products?search=latitude", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["total"] == 1


def test_staff_cannot_see_inactive(client: TestClient, admin_headers: dict, staff_headers: dict) -> None:
    brand_id, category_id = _make_brand_category(client, admin_headers)
    created = client.post(
        "/api/products", json=_product_payload(brand_id, category_id), headers=admin_headers
    ).json()
    client.put(
        f"/api/products/{created['id']}",
        json=_product_payload(brand_id, category_id, is_active=False),
        headers=admin_headers,
    )
    response = client.get("/api/products?include_inactive=true", headers=staff_headers)
    assert all(item["is_active"] is True for item in response.json()["items"])


def test_delete_product_without_history(client: TestClient, admin_headers: dict) -> None:
    brand_id, category_id = _make_brand_category(client, admin_headers)
    created = client.post(
        "/api/products", json=_product_payload(brand_id, category_id), headers=admin_headers
    ).json()
    response = client.delete(f"/api/products/{created['id']}", headers=admin_headers)
    assert response.status_code == 204


def test_delete_product_with_history_blocked(client: TestClient, admin_headers: dict, db_session) -> None:
    from app.models.stock_in import StockIn
    from app.models.user import User, UserRole
    from datetime import date

    brand_id, category_id = _make_brand_category(client, admin_headers)
    created = client.post(
        "/api/products", json=_product_payload(brand_id, category_id), headers=admin_headers
    ).json()

    admin = db_session.query(User).filter(User.role == UserRole.admin).first()
    db_session.add(StockIn(
        product_id=created["id"], quantity=5, stock_date=date.today(), created_by=admin.id
    ))
    db_session.commit()

    response = client.delete(f"/api/products/{created['id']}", headers=admin_headers)
    assert response.status_code == 409
    assert "stock history" in response.json()["detail"]