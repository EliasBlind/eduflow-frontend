import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuthStore } from "@/storage/auth.store";
import { useAuth } from "@/hooks/auth/useAuth";

beforeEach(() => {
  useAuthStore.setState({
    accessToken:     null,
    refreshToken:    null,
    user:            null,
    role:            "",
    isAuthenticated: false,
  });
});

describe("useAuth", () => {
  it("возвращает начальное состояние", () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.accessToken).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.role).toBe("");
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isTeacher).toBe(false);
    expect(result.current.isStudent).toBe(false);
  });

  it("isAdmin = true когда role = admin", () => {
    useAuthStore.setState({ role: "admin" });
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isTeacher).toBe(false);
    expect(result.current.isStudent).toBe(false);
  });

  it("isTeacher = true когда role = teacher", () => {
    useAuthStore.setState({ role: "teacher" });
    const { result } = renderHook(() => useAuth());

    expect(result.current.isTeacher).toBe(true);
  });

  it("isStudent = true когда role = student", () => {
    useAuthStore.setState({ role: "student" });
    const { result } = renderHook(() => useAuth());

    expect(result.current.isStudent).toBe(true);
  });

  it("реагирует на изменение стора", async () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);

    await act(async () => {
      useAuthStore.getState().setTokens({
        accessToken:  "acc",
        refreshToken: "ref",
      });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.accessToken).toBe("acc");
  });
});
