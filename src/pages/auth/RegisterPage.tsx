import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useRegister } from "@/hooks/auth/useRegister";
import { useAuth } from "@/hooks/auth/useAuth";
import { styles } from "./RegisterPage.styles";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { register, loading, error } = useRegister();

  const [email, setEmail]               = useState("");
  const [loginField, setLoginField]     = useState("");
  const [password, setPassword]         = useState("");
  const [confirmPassword, setConfirm]   = useState("");
  const [formError, setFormError]       = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validate = (): string | null => {
    if (!email.trim()) return t("auth.errEmailRequired");
    if (!EMAIL_REGEX.test(email.trim())) return t("auth.errEmailInvalid");
    if (!loginField.trim()) return t("auth.errLoginRequired");
    if (loginField.trim().length < 3) return t("auth.errLoginMin");
    if (!password) return t("auth.errPasswordRequired");
    if (password.length < 6) return t("auth.errPasswordMin6");
    if (password !== confirmPassword) return t("auth.errPasswordMismatch");
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

    const trimmedEmail = email.trim();

    try {
      await register({
        email:    trimmedEmail,
        login:    loginField.trim(),
        password,
      });

      // Прокидываем email на страницу верификации,
      // чтобы пользователю не пришлось вводить его повторно
      navigate("/auth/verify", {
        replace: true,
        state: { email: trimmedEmail },
      });
    } catch {
      // Ошибка уже в стейте хука
    }
  };

  const displayError = formError ?? error;

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>{t("auth.registerTitle")}</h1>

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
              style={styles.input}
            />
          </div>

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
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="confirmPassword" style={styles.label}>{t("auth.confirmPassword")}</label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirm(e.target.value)}
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
            {loading ? t("auth.creating") : t("auth.registerButton")}
          </button>
        </form>

        <p style={styles.footer}>
          {t("auth.haveAccount")}{" "}
          <Link to="/auth/login" style={styles.link}>
            {t("auth.loginButton")}
          </Link>
        </p>
      </div>
    </div>
  );
}
