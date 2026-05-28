import { renderHook, act } from "@testing-library/react";
import { useAuthStore } from "@/storage/auth.store";
import { useVerifyEmail } from "@/hooks/auth/useVerifyEmail";
import { auth } from "@/api/client";
import { describe, it, vi, expect, beforeEach } from "vitest";

vi.mock("@/api/client", () => ({
  auth: { verifyEmail: vi.fn() },
}));

const mockVerify = vi.mocked(auth.verifyEmail);

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ accessToken: null, isAuthenticated: false });
});

describe("useVerifyEmail", () => {
  it("сохраняет токены после верификации", async () => {
    mockVerify.mockResolvedValue({ accessToken: "acc", refreshToken: "ref" });

    const { result } = renderHook(() => useVerifyEmail());

    await act(async () => {
      await result.current.verify("123456", "u@e.com");
    });

    expect(useAuthStore.getState().accessToken).toBe("acc");
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(mockVerify).toHaveBeenCalledWith({ code: "123456", email: "u@e.com" });
  });

  it("ошибка — токены не сохраняются", async () => {
    mockVerify.mockRejectedValue(new Error("Неверный код"));

    const { result } = renderHook(() => useVerifyEmail());

    await act(async () => {
      await result.current.verify("000000", "u@e.com").catch(() => {});
    });

    expect(result.current.error).toBe("Неверный код");
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
