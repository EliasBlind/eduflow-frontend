import { renderHook, act } from "@testing-library/react";
import { useAuthStore } from "@/storage/auth.store";
import { useLogout } from "@/hooks/auth/useLogout";
import { describe, it, expect, beforeEach } from "vitest";

beforeEach(() => {
  useAuthStore.setState({
    accessToken:     "acc",
    refreshToken:    "ref",
    role:            "admin",
    isAuthenticated: true,
    user:            { id: "1", login: "u", role: "admin", email: "u@example.com" },
  });
});

describe("useLogout", () => {
  it("очищает весь стор", () => {
    const { result } = renderHook(() => useLogout());

    act(() => { result.current.logout(); });

    const s = useAuthStore.getState();
    expect(s.accessToken).toBeNull();
    expect(s.refreshToken).toBeNull();
    expect(s.isAuthenticated).toBe(false);
    expect(s.user).toBeNull();
    expect(s.role).toBe("");
  });
});
