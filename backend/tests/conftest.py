from typing import Annotated

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import Session, sessionmaker

from app import models  # noqa: F401  (makes sure all tables are registered)
from app.core.config import settings
from app.core.database import Base, get_db
from app.core.security import create_access_token, hash_password
from app.dependencies.auth import require_admin
from app.main import app
from app.models.user import User, UserRole

TEST_DB_NAME = "laptop_store_test"
test_engine = create_engine(make_url(settings.database_url).set(database=TEST_DB_NAME), pool_pre_ping=True)
TestingSessionLocal = sessionmaker(bind=test_engine, autoflush=False, autocommit=False)

PASSWORD = "Password123"


@pytest.fixture(scope="session", autouse=True)
def prepare_database():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    yield


@pytest.fixture(autouse=True)
def clean_tables():
    yield
    with test_engine.begin() as connection:
        for table in reversed(Base.metadata.sorted_tables):
            connection.execute(table.delete())


@pytest.fixture
def db_session():
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def client():
    app.dependency_overrides[get_db] = _override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def _create_user(db: Session, email: str, full_name: str, role: UserRole, is_active: bool = True) -> User:
    user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(PASSWORD),
        role=role,
        is_active=is_active,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_user(db_session: Session) -> User:
    return _create_user(db_session, "admin@example.com", "Test Admin", UserRole.admin)


@pytest.fixture
def staff_user(db_session: Session) -> User:
    return _create_user(db_session, "staff@example.com", "Test Staff", UserRole.staff)


@pytest.fixture
def inactive_staff_user(db_session: Session) -> User:
    return _create_user(db_session, "inactive@example.com", "Inactive Staff", UserRole.staff, is_active=False)


@pytest.fixture
def admin_headers(admin_user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(admin_user.id, 'admin')}"}


@pytest.fixture
def staff_headers(staff_user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_access_token(staff_user.id, 'staff')}"}


@pytest.fixture
def admin_only_client(client: TestClient) -> TestClient:
    """A tiny app with one Admin-only route, to test require_admin until real Admin routes exist."""
    mini_app = FastAPI()

    @mini_app.get("/admin-only")
    def admin_only(user: Annotated[User, Depends(require_admin)]) -> dict[str, bool]:
        return {"ok": True}

    mini_app.dependency_overrides[get_db] = _override_get_db
    return TestClient(mini_app)
