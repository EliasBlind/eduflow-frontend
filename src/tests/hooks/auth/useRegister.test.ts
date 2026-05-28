import { renderHook, act } from "@testing-library/react";
import { useRegister } from "@/hooks/auth/useRegister";
import { auth } from "@/api/client";
import { describe, it, vi, expect, beforeEach } from "vitest";

vi.mock("@/api/client", () => ({
  auth: { register: vi.fn() },
}));

const mockRegister = vi.mocked(auth.register);

beforeEach(() => { vi.clearAllMocks(); });

describe("useRegister", () => {
  it("успешная регистрация — нет ошибок", async () => {
    mockRegister.mockResolvedValue(undefined);

    const { result } = renderHook(() => useRegister());

    await act(async () => {
      await result.current.register({ login: "u", password: "p", email: "u@e.com" });
    });

    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(mockRegister).toHaveBeenCalledWith({ login: "u", password: "p", email: "u@e.com", appId: 1 });
  });

  it("ошибка сервера сохраняется", async () => {
    mockRegister.mockRejectedValue(new Error("Email занят"));

    const { result } = renderHook(() => useRegister());

    await act(async () => {
      await result.current.register({ login: "u", password: "p", email: "u@e.com" }).catch(() => {});
    });

    expect(result.current.error).toBe("Email занят");
  });
});
