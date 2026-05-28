import { renderHook, act } from "@testing-library/react";
import { useAuthStore } from "@/storage/auth.store";
import { useRefreshToken } from "@/hooks/auth/useRefreshToken";
import { auth } from "@/api/client";
import { describe, it, vi, expect, beforeEach } from "vitest";

vi.mock("@/api/client", () => ({
  auth: { refreshToken: vi.fn() },
}));
vi.mock("@/api/appId", () => ({ APP_ID: 1 }));

const mockRefresh = vi.mocked(auth.refreshToken);

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    accessToken:     "old-acc",
    refreshToken:    "old-ref",
    isAuthenticated: true,
  });
});

describe("useRefreshToken", () => {
  it("обновляет токены", async () => {
    mockRefresh.mockResolvedValue({ accessToken: "new-acc", refreshToken: "new-ref" });

    const { result } = renderHook(() => useRefreshToken());
    await act(async () => { await result.current.refresh(); });

    expect(useAuthStore.getState().accessToken).toBe("new-acc");
    expect(mockRefresh).toHaveBeenCalledWith({ refreshToken: "old-ref", appId: 1 });
  });

  it("при ошибке вызывает clear", async () => {
    mockRefresh.mockRejectedValue(new Error("Токен истёк"));

    const { result } = renderHook(() => useRefreshToken());
    await act(async () => { await result.current.refresh().catch(() => {}); });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(result.current.error).toBe("Токен истёк");
  });

  it("без refreshToken сразу вызывает clear", async () => {
    useAuthStore.setState({ refreshToken: null });

    const { result } = renderHook(() => useRefreshToken());
    await act(async () => { await result.current.refresh(); });

    expect(mockRefresh).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
