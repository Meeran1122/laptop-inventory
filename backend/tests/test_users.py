from fastapi.testclient import TestClient


def _create_payload() -> dict:
    return {
        "full_name": "Ali Khan",
        "email": "ali@example.com",
        "password": "Password123",
    }


def test_create_staff(client: TestClient, admin_headers: dict) -> None:
    response = client.post("/api/users", json=_create_payload(), headers=admin_headers)
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["full_name"] == "Ali Khan"
    assert body["email"] == "ali@example.com"
    assert body["role"] == "staff"
    assert body["is_active"] is True
    assert "password" not in body
    assert "password_hash" not in body


def test_create_staff_duplicate_email(client: TestClient, admin_headers: dict) -> None:
    client.post("/api/users", json=_create_payload(), headers=admin_headers)
    response = client.post("/api/users", json=_create_payload(), headers=admin_headers)
    assert response.status_code == 409
    assert response.json()["detail"] == "Email already exists."


def test_create_staff_requires_admin(client: TestClient, staff_headers: dict) -> None:
    response = client.post("/api/users", json=_create_payload(), headers=staff_headers)
    assert response.status_code == 403


def test_create_staff_requires_auth(client: TestClient) -> None:
    response = client.post("/api/users", json=_create_payload())
    assert response.status_code == 401


def test_list_users(client: TestClient, admin_headers: dict, admin_user) -> None:
    client.post("/api/users", json=_create_payload(), headers=admin_headers)
    response = client.get("/api/users", headers=admin_headers)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["total"] >= 2  # admin + new staff
    assert "items" in body
    assert "page" in body
    assert "page_size" in body


def test_get_user_by_id(client: TestClient, admin_headers: dict) -> None:
    created = client.post("/api/users", json=_create_payload(), headers=admin_headers).json()
    response = client.get(f"/api/users/{created['id']}", headers=admin_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "ali@example.com"


def test_get_user_not_found(client: TestClient, admin_headers: dict) -> None:
    response = client.get("/api/users/999999", headers=admin_headers)
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found."


def test_update_user_full_name(client: TestClient, admin_headers: dict) -> None:
    created = client.post("/api/users", json=_create_payload(), headers=admin_headers).json()
    response = client.put(
        f"/api/users/{created['id']}",
        json={"full_name": "Ali Ahmed"},
        headers=admin_headers,
    )
    assert response.status_code == 200
    assert response.json()["full_name"] == "Ali Ahmed"


def test_deactivate_user(client: TestClient, admin_headers: dict) -> None:
    created = client.post("/api/users", json=_create_payload(), headers=admin_headers).json()
    response = client.put(
        f"/api/users/{created['id']}",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False


def test_admin_cannot_deactivate_self(client: TestClient, admin_headers: dict, admin_user) -> None:
    response = client.put(
        f"/api/users/{admin_user.id}",
        json={"is_active": False},
        headers=admin_headers,
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "You cannot deactivate your own account."


def test_staff_cannot_list_users(client: TestClient, staff_headers: dict) -> None:
    response = client.get("/api/users", headers=staff_headers)
    assert response.status_code == 403