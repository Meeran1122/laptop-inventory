from fastapi.testclient import TestClient


# ---------- Brands ----------

def test_create_brand(client: TestClient, admin_headers: dict) -> None:
    response = client.post("/api/brands", json={"name": "Dell"}, headers=admin_headers)
    assert response.status_code == 201, response.text
    assert response.json()["name"] == "Dell"


def test_create_brand_duplicate(client: TestClient, admin_headers: dict) -> None:
    client.post("/api/brands", json={"name": "Dell"}, headers=admin_headers)
    response = client.post("/api/brands", json={"name": "dell"}, headers=admin_headers)
    assert response.status_code == 409
    assert response.json()["detail"] == "Brand name already exists."


def test_create_brand_requires_admin(client: TestClient, staff_headers: dict) -> None:
    response = client.post("/api/brands", json={"name": "HP"}, headers=staff_headers)
    assert response.status_code == 403


def test_list_brands(client: TestClient, staff_headers: dict) -> None:
    response = client.get("/api/brands", headers=staff_headers)
    assert response.status_code == 200
    assert "items" in response.json()


def test_update_brand(client: TestClient, admin_headers: dict) -> None:
    created = client.post("/api/brands", json={"name": "Dell"}, headers=admin_headers).json()
    response = client.put(
        f"/api/brands/{created['id']}", json={"name": "Dell Inc"}, headers=admin_headers
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Dell Inc"


def test_delete_brand(client: TestClient, admin_headers: dict) -> None:
    created = client.post("/api/brands", json={"name": "Temp"}, headers=admin_headers).json()
    response = client.delete(f"/api/brands/{created['id']}", headers=admin_headers)
    assert response.status_code == 204


def test_delete_brand_not_found(client: TestClient, admin_headers: dict) -> None:
    response = client.delete("/api/brands/999999", headers=admin_headers)
    assert response.status_code == 404


# ---------- Categories ----------

def test_create_category(client: TestClient, admin_headers: dict) -> None:
    response = client.post("/api/categories", json={"name": "Business"}, headers=admin_headers)
    assert response.status_code == 201, response.text
    assert response.json()["name"] == "Business"


def test_create_category_duplicate(client: TestClient, admin_headers: dict) -> None:
    client.post("/api/categories", json={"name": "Business"}, headers=admin_headers)
    response = client.post("/api/categories", json={"name": "business"}, headers=admin_headers)
    assert response.status_code == 409
    assert response.json()["detail"] == "Category name already exists."


def test_create_category_requires_admin(client: TestClient, staff_headers: dict) -> None:
    response = client.post("/api/categories", json={"name": "Gaming"}, headers=staff_headers)
    assert response.status_code == 403


def test_list_categories(client: TestClient, staff_headers: dict) -> None:
    response = client.get("/api/categories", headers=staff_headers)
    assert response.status_code == 200
    assert "items" in response.json()


def test_delete_category_in_use_blocked(client: TestClient, admin_headers: dict, db_session) -> None:
    from app.models.brand import Brand
    from app.models.category import Category
    from app.models.product import Product
    from decimal import Decimal

    brand = Brand(name="TestBrand")
    category = Category(name="TestCat")
    db_session.add(brand)
    db_session.add(category)
    db_session.commit()
    db_session.refresh(brand)
    db_session.refresh(category)

    product = Product(
        name="Test Laptop",
        brand_id=brand.id,
        category_id=category.id,
        model="M1",
        processor="i5",
        ram="8GB",
        storage="256GB",
        purchase_price=Decimal("100000.00"),
        selling_price=Decimal("115000.00"),
        quantity=0,
        min_stock_level=2,
    )
    db_session.add(product)
    db_session.commit()

    response = client.delete(f"/api/categories/{category.id}", headers=admin_headers)
    assert response.status_code == 409
    assert "used by 1 product" in response.json()["detail"]