import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
// Импортируем иконки
import { Eye, EyeOff } from "lucide-react";

import { useLogin } from "@/hooks/auth/useLogin";
import { useAuth } from "@/hooks/auth/useAuth";
import { styles } from "./LoginPage.styles";

interface LocationState {
  from?: { pathname: string };
}

export default function LoginPage() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { login, loading, error } = useLogin();

  const [loginField, setLoginField] = useState("");
  const [password, setPassword]     = useState("");
  const [formError, setFormError]   = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const state = location.state as LocationState | null;
      const redirectTo = state?.from?.pathname ?? "/";
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const validate = (): string | null => {
    if (!loginField.trim()) return t("auth.errLoginRequired");
    if (loginField.trim().length < 3) return t("auth.errLoginMin");
    if (!password) return t("auth.errPasswordRequired");
    if (password.length < 5) return t("auth.errPasswordMin5");
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

    await login({ login: loginField.trim(), password });
  };

  const displayError = formError ?? error;

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>{t("auth.loginTitle")}</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div style={styles.field}>
            <label htmlFor="login" style={styles.label}>{t("auth.login")}</label>
            <input
              id="login"
              type="text"
              autoComplete="username"
              value={loginField}
              onChange={(e) => setLoginField(e.target.value)}
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>{t("auth.password")}</label>
            {/* Обертка для инпута и кнопки */}
            <div style={styles.inputContainer}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                style={styles.inputPassword}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                style={styles.eyeButton}
                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
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
            {loading ? t("auth.loggingIn") : t("auth.loginButton")}
          </button>
        </form>

        <p style={styles.footer}>
          {t("auth.noAccount")}{" "}
          <Link to="/auth/register" style={styles.link}>
            {t("auth.registerLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
