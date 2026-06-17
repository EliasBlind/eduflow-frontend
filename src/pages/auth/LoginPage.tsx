import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
// Импортируем иконки
import { Eye, EyeOff } from "lucide-react";

import { useLogin } from "@/hooks/auth/useLogin";
import { useAuth } from "@/hooks/auth/useAuth";

interface LocationState {
  from?: { pathname: string };
}

export default function LoginPage() {
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
    if (!loginField.trim()) return "Введите логин";
    if (loginField.trim().length < 3) return "Логин должен быть не менее 3 символов";
    if (!password) return "Введите пароль";
    if (password.length < 5) return "Пароль должен быть не менее 5 символов";
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
        <h1 style={styles.title}>Вход</h1>

        <form onSubmit={handleSubmit} noValidate>
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
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
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
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>

        <p style={styles.footer}>
          Нет аккаунта?{" "}
          <Link to="/auth/register" style={styles.link}>
            Зарегистрироваться
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
  // Контейнер для позиционирования кнопки относительно инпута
  inputContainer: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  // Инпут с увеличенным правым отступом, чтобы текст не залезал под иконку
  inputPassword: {
    width: "100%",
    padding: "10px 40px 10px 12px",
    fontSize: 14,
    border: "1px solid #d0d0d5",
    borderRadius: 6,
    outline: "none",
    boxSizing: "border-box",
  },
  // Стили для абсолютного позиционирования кнопки-иконки
  eyeButton: {
    position: "absolute",
    right: 12,
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#6b7280",
    padding: 0,
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
