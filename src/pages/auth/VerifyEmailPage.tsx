import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useVerifyEmail } from "@/hooks/auth/useVerifyEmail";
import { useAuth } from "@/hooks/auth/useAuth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LocationState {
  email?: string;
}

export default function VerifyEmailPage() {
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
    if (!email.trim()) return "Введите email";
    if (!EMAIL_REGEX.test(email.trim())) return "Некорректный формат email";
    if (!code.trim()) return "Введите код подтверждения";
    if (code.trim().length < 4) return "Код слишком короткий";
    return null;
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>	) => {
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
        <h1 style={styles.title}>Подтверждение email</h1>

        <p style={styles.subtitle}>
          {initialEmail
            ? `Мы отправили код на ${initialEmail}. Введите его ниже.`
            : "Введите ваш email и код подтверждения, отправленный на почту."}
        </p>

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
              readOnly={Boolean(initialEmail)}
              style={{
                ...styles.input,
                ...(initialEmail ? styles.inputReadonly : {}),
              }}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="code" style={styles.label}>Код подтверждения</label>
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
            {loading ? "Проверка..." : "Подтвердить"}
          </button>
        </form>

        <p style={styles.footer}>
          <Link to="/auth/login" style={styles.link}>
            Вернуться ко входу
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
    margin: "0 0 8px",
    fontSize: 24,
    fontWeight: 600,
    textAlign: "center",
  },
  subtitle: {
    margin: "0 0 24px",
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 1.5,
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
  inputReadonly: { background: "#f5f5f7", color: "#666" },
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
