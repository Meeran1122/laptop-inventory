from datetime import datetime, timedelta, timezone

import jwt
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.security import ALGORITHM
from app.models.user import User

PASSWORD = "Password123"


def test_login_success(client: TestClient, admin_user: User) -> None:
    response = client.post("/api/auth/login", json={"email": "admin@example.com", "password": PASSWORD})
    assert response.status_code == 200
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == "admin@example.com"
    assert body["user"]["role"] == "admin"
    assert "password_hash" not in body["user"]


def test_login_email_is_case_insensitive(client: TestClient, admin_user: User) -> None:
    response = client.post("/api/auth/login", json={"email": "ADMIN@example.com", "password": PASSWORD})
    assert response.status_code == 200


def test_login_wrong_password(client: TestClient, admin_user: User) -> None:
    response = client.post("/api/auth/login", json={"email": "admin@example.com", "password": "WrongPass1"})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


def test_login_unknown_email(client: TestClient) -> None:
    response = client.post("/api/auth/login", json={"email": "nobody@example.com", "password": PASSWORD})
    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password."


def test_login_deactivated_user_is_refused(client: TestClient, inactive_staff_user: User) -> None:
    response = client.post("/api/auth/login", json={"email": "inactive@example.com", "password": PASSWORD})
    assert response.status_code == 403
    assert response.json()["detail"] == "This account is deactivated."


def test_me_without_token(client: TestClient) -> None:
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_with_invalid_token(client: TestClient) -> None:
    response = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-real-token"})
    assert response.status_code == 401


def test_me_with_expired_token(client: TestClient, admin_user: User) -> None:
    expired = jwt.encode(
        {"sub": str(admin_user.id), "role": "admin", "exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        settings.secret_key,
        algorithm=ALGORITHM,
    )
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {expired}"})
    assert response.status_code == 401


def test_me_with_valid_token(client: TestClient, staff_user: User, staff_headers: dict[str, str]) -> None:
    response = client.get("/api/auth/me", headers=staff_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "staff@example.com"
    assert response.json()["role"] == "staff"


def test_me_with_token_of_deactivated_user(client: TestClient, db_session, staff_user: User, staff_headers) -> None:
    staff_user.is_active = False
    db_session.commit()
    response = client.get("/api/auth/me", headers=staff_headers)
    assert response.status_code == 403


def test_admin_only_route_blocks_staff(admin_only_client: TestClient, staff_headers: dict[str, str]) -> None:
    response = admin_only_client.get("/admin-only", headers=staff_headers)
    assert response.status_code == 403
    assert response.json()["detail"] == "Admin access required."


def test_admin_only_route_allows_admin(admin_only_client: TestClient, admin_headers: dict[str, str]) -> None:
    response = admin_only_client.get("/admin-only", headers=admin_headers)
    assert response.status_code == 200


def test_admin_only_route_without_token(admin_only_client: TestClient) -> None:
    response = admin_only_client.get("/admin-only")
    assert response.status_code == 401
