# =============================================================================
# AquaSentinel AI — Auth Router
# =============================================================================
# POST /api/auth/login   — validate credentials, return JWT + user
# POST /api/auth/logout  — no-op for stateless JWT
# GET  /api/auth/me      — return current user from JWT
# =============================================================================

from datetime import datetime, timedelta, timezone

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from config import settings
from database import get_db
from models import User
from schemas import LoginRequest, LoginResponse, AuthUserSchema

router = APIRouter(prefix="/auth", tags=["auth"])

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def _create_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRY_MINUTES)
    return jwt.encode(
        {"sub": user_id, "exp": expire},
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    """Dependency to extract and validate the current user from the JWT."""
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ─── Endpoints ────────────────────────────────────────────────────────────────────


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = _create_token(user.id)
    return LoginResponse(
        access_token=token,
        user=AuthUserSchema(
            id=user.id,
            email=user.email,
            name=user.name,
            avatarUrl=user.avatar_url,
        ),
    )


@router.post("/logout", status_code=204)
def logout():
    # Stateless JWT — nothing to invalidate server-side
    return None


@router.get("/me", response_model=AuthUserSchema)
def me(user: User = Depends(get_current_user)):
    return AuthUserSchema(
        id=user.id,
        email=user.email,
        name=user.name,
        avatarUrl=user.avatar_url,
    )
