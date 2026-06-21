import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useVerifyEmail } from "@/hooks/auth/useVerifyEmail";
import { useAuth } from "@/hooks/auth/useAuth";
import { styles } from "./VerifyEmailPage.styles";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LocationState {
  email?: string;
}

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { verify, loading, error } = useVerifyEmail();

  // Email может прийти со страницы регистрации через router state
  const initialEmail = (location.state as LocationState | null)?.email ?? "";

  const [email, setEmail]         = useState(initialEmail);
  const [code, setCode]           = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // После успешной верификации useVerifyEmail сохранит токены
  // → isAuthenticated станет true → редирект
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validate = (): string | null => {
    if (!email.trim()) return t("auth.errEmailRequired");
    if (!EMAIL_REGEX.test(email.trim())) return t("auth.errEmailInvalid");
    if (!code.trim()) return t("auth.errCodeRequired");
    if (code.trim().length < 4) return t("auth.errCodeShort");
    return null;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const validationError = validate();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      await verify(code.trim(), email.trim());
      // Редирект отработает в useEffect
    } catch {
      // Ошибка уже в стейте хука
    }
  };

  const displayError = formError ?? error;

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>{t("auth.verifyTitle")}</h1>

        <p style={styles.subtitle}>
          {initialEmail
            ? t("auth.verifySubtitleSent", { email: initialEmail })
            : t("auth.verifySubtitleManual")}
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>{t("auth.email")}</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              readOnly={Boolean(initialEmail)}
              style={{
                ...styles.input,
                ...(initialEmail ? styles.inputReadonly : {}),
              }}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="code" style={styles.label}>{t("auth.code")}</label>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
              style={styles.input}
            />
          </div>

          {displayError && (
            <div role="alert" style={styles.error}>
              {displayError}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
          >
            {loading ? t("auth.verifying") : t("auth.verifyButton")}
          </button>
        </form>

        <p style={styles.footer}>
          <Link to="/auth/login" style={styles.link}>
            {t("auth.backToLogin")}
          </Link>
        </p>
      </div>
    </div>
  );
}
