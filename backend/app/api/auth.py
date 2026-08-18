import logging
from datetime import datetime, timedelta, timezone

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Response,
    status,
)
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    UserResponse,
)


logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.post(
    "/login",
    response_model=UserResponse,
)
def login(
    response: Response,
    credentials: LoginRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(
            User.username == credentials.username
        )
        .first()
    )

    now = datetime.now(timezone.utc)

    # Usuario inexistente: mantenemos mensaje genérico para no revelar
    # qué nombres de usuario existen.
    if user is None:
        logger.warning(
            "security_login_failed "
            "username=%r reason=user_not_found",
            credentials.username,
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
        )

    if not user.is_active:
        logger.warning(
            "security_login_failed "
            "username=%r user_id=%s "
            "reason=inactive_user",
            user.username,
            user.id,
        )

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
        )

    # Comprobar si la cuenta sigue temporalmente bloqueada.
    if user.locked_until is not None:
        locked_until = user.locked_until

        # Protección por si el driver devuelve un datetime sin timezone.
        if locked_until.tzinfo is None:
            locked_until = locked_until.replace(
                tzinfo=timezone.utc
            )

        if locked_until > now:
            retry_after = max(
                1,
                int((locked_until - now).total_seconds()),
            )

            logger.warning(
                "security_login_blocked "
                "username=%r user_id=%s "
                "retry_after_seconds=%s",
                user.username,
                user.id,
                retry_after,
            )

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    "Demasiados intentos fallidos. "
                    "Inténtalo de nuevo más tarde."
                ),
                headers={
                    "Retry-After": str(retry_after)
                },
            )

        # El bloqueo ya expiró.
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()

        logger.info(
            "security_account_unlocked "
            "username=%r user_id=%s reason=timeout",
            user.username,
            user.id,
        )

    if not verify_password(
        credentials.password,
        user.password_hash,
    ):
        user.failed_login_attempts = (
            (user.failed_login_attempts or 0) + 1
        )

        logger.warning(
            "security_login_failed "
            "username=%r user_id=%s "
            "reason=bad_password failed_attempts=%s",
            user.username,
            user.id,
            user.failed_login_attempts,
        )

        if (
            user.failed_login_attempts
            >= settings.login_max_attempts
        ):
            user.locked_until = now + timedelta(
                minutes=settings.login_lock_minutes
            )

            db.commit()

            logger.warning(
                "security_account_locked "
                "username=%r user_id=%s "
                "failed_attempts=%s lock_minutes=%s",
                user.username,
                user.id,
                user.failed_login_attempts,
                settings.login_lock_minutes,
            )

            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=(
                    "Demasiados intentos fallidos. "
                    f"Cuenta bloqueada durante "
                    f"{settings.login_lock_minutes} minutos."
                ),
                headers={
                    "Retry-After": str(
                        settings.login_lock_minutes * 60
                    )
                },
            )

        db.commit()

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
        )

    # Login correcto: reiniciar contador y bloqueo.
    if (
        user.failed_login_attempts != 0
        or user.locked_until is not None
    ):
        user.failed_login_attempts = 0
        user.locked_until = None
        db.commit()

    token = create_access_token(
        user_id=user.id,
        username=user.username,
    )

    response.set_cookie(
        key=settings.auth_cookie_name,
        value=token,
        httponly=True,
        secure=(
            settings.environment == "production"
        ),
        samesite="strict",
        max_age=(
            settings.access_token_expire_minutes
            * 60
        ),
        path="/",
    )

    logger.info(
        "security_login_success "
        "username=%r user_id=%s",
        user.username,
        user.id,
    )

    return user


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
)
def logout(
    response: Response,
):
    response.delete_cookie(
        key=settings.auth_cookie_name,
        path="/",
    )


@router.get(
    "/me",
    response_model=UserResponse,
)
def me(
    current_user: User = Depends(
        get_current_user
    ),
):
    return current_user
