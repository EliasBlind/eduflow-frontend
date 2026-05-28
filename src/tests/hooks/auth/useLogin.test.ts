import { renderHook, act } from "@testing-library/react";
import { describe, it, vi, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/storage/auth.store";
import { useLogin } from "@/hooks/auth/useLogin";
import { auth } from "@/api/client";

vi.mock("@/api/client", () => ({
  auth: { login: vi.fn() },
}));

const mockLogin = vi.mocked(auth.login);

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ accessToken: null, refreshToken: null, isAuthenticated: false });
});

describe("useLogin", () => {
  it("успешный логин сохраняет токены", async () => {
    mockLogin.mockResolvedValue({ accessToken: "acc", refreshToken: "ref" });

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login({ login: "user", password: "pass" });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(useAuthStore.getState().accessToken).toBe("acc");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it("передаёт appId = 1 по умолчанию", async () => {
    mockLogin.mockResolvedValue({ accessToken: "acc", refreshToken: "ref" });

    const { result } = renderHook(() => useLogin());
    await act(async () => {
      await result.current.login({ login: "user", password: "pass" });
    });

    expect(mockLogin).toHaveBeenCalledWith({ login: "user", password: "pass", appId: 1 });
  });

  it("ошибка API сохраняется в error", async () => {
    mockLogin.mockRejectedValue(new Error("Неверный пароль"));

    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login({ login: "user", password: "wrong" }).catch(() => {});
    });

    expect(result.current.error).toBe("Неверный пароль");
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it("loading = true во время запроса", async () => {
    let resolve!: (v: { accessToken: string; refreshToken: string }) => void;
    mockLogin.mockReturnValue(new Promise((r) => { resolve = r; }));

    const { result } = renderHook(() => useLogin());

    act(() => { result.current.login({ login: "u", password: "p" }); });
    expect(result.current.loading).toBe(true);

    await act(async () => { resolve({ accessToken: "a", refreshToken: "r" }); });
    expect(result.current.loading).toBe(false);
  });
});
