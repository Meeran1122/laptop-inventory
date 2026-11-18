from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models import User, UserRole


def create_tables() -> None:
    Base.metadata.create_all(bind=engine)


def create_first_admin(db: Session) -> None:
    existing_admin = db.scalars(select(User).where(User.role == UserRole.admin).limit(1)).first()
    if existing_admin is not None:
        return

    admin = User(
        full_name="Admin",
        email=settings.admin_email.lower(),
        password_hash=hash_password(settings.admin_password),
        role=UserRole.admin,
        is_active=True,
    )
    db.add(admin)
    db.commit()


def init_db() -> None:
    create_tables()
    with SessionLocal() as db:
        create_first_admin(db)
