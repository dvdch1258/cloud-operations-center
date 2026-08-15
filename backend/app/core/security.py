import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User


password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def create_access_token(*, user_id: int, username: str) -> str:
    if not settings.jwt_secret_key:
        raise RuntimeError("JWT_SECRET_KEY no está definida")

    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "username": username,
        "iat": now,
        "exp": now + timedelta(
            minutes=settings.access_token_expire_minutes
        ),
    }

    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )



def verify_internal_api_key(
    api_key: str | None = Header(
        default=None,
        alias="X-Internal-API-Key",
    ),
) -> None:
    expected = settings.service_checker_api_key

    if not expected:
        raise RuntimeError(
            "SERVICE_CHECKER_API_KEY no está definida"
        )

    if api_key is None or not secrets.compare_digest(
        api_key,
        expected,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credencial interna inválida",
        )



def verify_n8n_api_key(
    api_key: str | None = Header(
        default=None,
        alias="X-N8N-API-Key",
    ),
) -> None:
    expected = settings.n8n_api_key

    if not expected:
        raise RuntimeError(
            "N8N_API_KEY no está definida"
        )

    if api_key is None or not secrets.compare_digest(
        api_key,
        expected,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credencial n8n inválida",
        )


def authentication_exception() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise authentication_exception()

    if credentials.scheme.lower() != "bearer":
        raise authentication_exception()

    if not settings.jwt_secret_key:
        raise RuntimeError("JWT_SECRET_KEY no está definida")

    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"require": ["exp", "sub"]},
        )

        user_id = int(payload["sub"])

    except (InvalidTokenError, KeyError, TypeError, ValueError):
        raise authentication_exception()

    user = db.get(User, user_id)

    if user is None or not user.is_active:
        raise authentication_exception()

    return user
