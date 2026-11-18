from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate
from fastapi import HTTPException, status


def _email_exists(db: Session, email: str, exclude_user_id: int | None = None) -> bool:
    stmt = select(User).where(func.lower(User.email) == email.lower())
    if exclude_user_id is not None:
        stmt = stmt.where(User.id != exclude_user_id)
    return db.scalars(stmt).first() is not None


def create_staff(db: Session, data: UserCreate) -> User:
    email = data.email.lower()
    if _email_exists(db, email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists.")

    user = User(
        full_name=data.full_name.strip(),
        email=email,
        password_hash=hash_password(data.password),
        role=UserRole.staff,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_users(db: Session, page: int, page_size: int, search: str | None) -> tuple[list[User], int]:
    base = select(User)
    count_stmt = select(func.count()).select_from(User)

    if search:
        term = f"%{search.strip().lower()}%"
        condition = or_(
            func.lower(User.full_name).like(term),
            func.lower(User.email).like(term),
        )
        base = base.where(condition)
        count_stmt = count_stmt.where(condition)

    total = db.scalar(count_stmt) or 0
    offset = (page - 1) * page_size
    users = list(db.scalars(base.order_by(User.created_at.desc()).offset(offset).limit(page_size)).all())
    return users, total


def get_user_or_404(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user


def update_user(db: Session, user_id: int, data: UserUpdate, current_user: User) -> User:
    user = get_user_or_404(db, user_id)

    if data.email is not None and data.email.lower() != user.email.lower():
        if _email_exists(db, data.email, exclude_user_id=user.id):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists.")
        user.email = data.email.lower()

    if data.full_name is not None:
        user.full_name = data.full_name.strip()

    if data.is_active is not None:
        if user.id == current_user.id and data.is_active is False:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot deactivate your own account.",
            )
        user.is_active = data.is_active

    db.commit()
    db.refresh(user)
    return user