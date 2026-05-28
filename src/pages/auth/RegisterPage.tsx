import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useRegister } from "@/hooks/auth/useRegister";
import { useAuth } from "@/hooks/auth/useAuth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
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
    if (!email.trim()) return "Введите email";
    if (!EMAIL_REGEX.test(email.trim())) return "Некорректный формат email";
    if (!loginField.trim()) return "Введите логин";
    if (loginField.trim().length < 3) return "Логин должен быть не менее 3 символов";
    if (!password) return "Введите пароль";
    if (password.length < 6) return "Пароль должен быть не менее 6 символов";
    if (password !== confirmPassword) return "Пароли не совпадают";
    return null;
  };

	const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
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
        <h1 style={styles.title}>Регистрация</h1>

        <form onSubmit={handleSubmit} noValidate>
          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>Email</label>
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
            <label htmlFor="login" style={styles.label}>Логин</label>
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
            <label htmlFor="password" style={styles.label}>Пароль</label>
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
            <label htmlFor="confirmPassword" style={styles.label}>Повторите пароль</label>
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
            {loading ? "Создание..." : "Создать аккаунт"}
          </button>
        </form>

        <p style={styles.footer}>
          Уже есть аккаунт?{" "}
          <Link to="/auth/login" style={styles.link}>
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f5f7",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    background: "#fff",
    padding: 32,
    borderRadius: 8,
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  title: {
    margin: "0 0 24px",
    fontSize: 24,
    fontWeight: 600,
    textAlign: "center",
  },
  field: { marginBottom: 16 },
  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 14,
    color: "#333",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    fontSize: 14,
    border: "1px solid #d0d0d5",
    borderRadius: 6,
    outline: "none",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "10px 12px",
    fontSize: 15,
    fontWeight: 500,
    color: "#fff",
    background: "#2563eb",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    marginTop: 8,
  },
  buttonDisabled: { background: "#93b4f0", cursor: "not-allowed" },
  error: {
    padding: "8px 12px",
    marginBottom: 12,
    background: "#fee",
    color: "#b00020",
    border: "1px solid #fbb",
    borderRadius: 6,
    fontSize: 13,
  },
  footer: {
    marginTop: 20,
    fontSize: 14,
    textAlign: "center",
    color: "#555",
  },
  link: { color: "#2563eb", textDecoration: "none" },
};
