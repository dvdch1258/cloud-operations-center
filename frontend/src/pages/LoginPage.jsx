import {
  useEffect,
  useState,
} from "react";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useTranslation,
} from "react-i18next";

import { useAuth } from "../auth/useAuth";
import LanguageSwitcher from "../components/LanguageSwitcher";


function formatCountdown(totalSeconds) {
  const minutes = Math.floor(
    totalSeconds / 60,
  );

  const seconds =
    totalSeconds % 60;

  return `${String(minutes).padStart(
    2,
    "0",
  )}:${String(seconds).padStart(
    2,
    "0",
  )}`;
}


export default function LoginPage() {
  const {
    user,
    loading,
    login,
  } = useAuth();

  const {
    t,
  } = useTranslation();

  const location = useLocation();
  const navigate = useNavigate();

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    lockSeconds,
    setLockSeconds,
  ] = useState(0);


  useEffect(() => {
    if (lockSeconds <= 0) {
      return undefined;
    }

    const timer =
      window.setTimeout(
        () => {
          setLockSeconds(
            (current) =>
              Math.max(
                0,
                current - 1,
              ),
          );
        },
        1000,
      );

    return () => {
      window.clearTimeout(timer);
    };
  }, [lockSeconds]);


  if (loading) {
    return (
      <div className="auth-loading">
        <div className="brand__logo">
          CO
        </div>

        <span>
          {t("login.validating")}
        </span>
      </div>
    );
  }


  if (user) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }


  async function handleSubmit(event) {
    event.preventDefault();

    if (lockSeconds > 0) {
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await login(
        username.trim(),
        password,
      );

      const destination =
        location.state
          ?.from
          ?.pathname || "/";

      navigate(
        destination,
        {
          replace: true,
        },
      );
    } catch (err) {
      if (err.status === 429) {
        setLockSeconds(
          Number.isFinite(
            err.retryAfter,
          )
            ? err.retryAfter
            : 15 * 60,
        );

        setError(
          t("login.errors.locked"),
        );
      } else {
        setError(
          t("login.errors.failed"),
        );
      }
    } finally {
      setSubmitting(false);
    }
  }


  return (
    <main className="login-page">
      <section className="login-card">
        <LanguageSwitcher
          className="language-switcher--login"
        />

        <div className="login-brand">
          <div className="brand__logo">
            CO
          </div>

          <div>
            <strong>
              Cloud Operations
            </strong>

            <span>
              {t(
                "login.brandTagline",
              )}
            </span>
          </div>
        </div>

        <div className="login-card__heading">
          <p className="eyebrow">
            {t("login.eyebrow")}
          </p>

          <h1>
            {t("login.title")}
          </h1>

          <p>
            {t(
              "login.description",
            )}
          </p>
        </div>

        {error && (
          <div className="alert alert--error">
            <strong>
              {lockSeconds > 0
                ? t(
                    "login.accessBlocked",
                  )
                : t(
                    "login.signInFailed",
                  )}
            </strong>

            <span>
              {error}
            </span>

            {lockSeconds > 0 && (
              <span>
                {t(
                  "login.retryIn",
                  {
                    countdown:
                      formatCountdown(
                        lockSeconds,
                      ),
                  },
                )}
              </span>
            )}
          </div>
        )}

        <form
          className="login-form"
          onSubmit={handleSubmit}
        >
          <label>
            {t("login.username")}

            <input
              type="text"
              value={username}
              autoComplete="username"
              required
              maxLength={100}
              onChange={(event) =>
                setUsername(
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            {t("login.password")}

            <input
              type="password"
              value={password}
              autoComplete="current-password"
              required
              onChange={(event) =>
                setPassword(
                  event.target.value,
                )
              }
            />
          </label>

          <button
            type="submit"
            className="primary-button login-button"
            disabled={
              submitting ||
              lockSeconds > 0
            }
          >
            {lockSeconds > 0
              ? t(
                  "login.lockedButton",
                  {
                    countdown:
                      formatCountdown(
                        lockSeconds,
                      ),
                  },
                )
              : submitting
                ? t(
                    "login.submitting",
                  )
                : t(
                    "login.submit",
                  )}
          </button>
        </form>

        <div className="login-security">
          <span className="connection-dot" />

          {t(
            "login.encryptedConnection",
          )}
        </div>
      </section>
    </main>
  );
}
