import { renderHook, act } from "@testing-library/react";
import { useMutation } from "@/hooks/journal/useMutation";
import { describe, it, vi, expect, beforeEach } from "vitest";

describe("useMutation", () => {
  it("успешный вызов возвращает данные", async () => {
    const fn = vi.fn().mockResolvedValue({ id: "1" });
    const { result } = renderHook(() => useMutation(fn));

    let data: any;
    await act(async () => {
      data = await result.current.mutate({ name: "test" });
    });

    expect(data).toEqual({ id: "1" });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("ошибка сохраняется в error и пробрасывается", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("Bad request"));
    const { result } = renderHook(() => useMutation(fn));

    await act(async () => {
      await result.current.mutate({}).catch(() => {});
    });

    expect(result.current.error).toBe("Bad request");
  });

  it("loading = true во время запроса", async () => {
    let resolve!: (v: any) => void;
    const fn = vi.fn().mockReturnValue(new Promise((r) => { resolve = r; }));
    const { result } = renderHook(() => useMutation(fn));

    act(() => { result.current.mutate({}); });
    expect(result.current.loading).toBe(true);

    await act(async () => { resolve({ id: "1" }); });
    expect(result.current.loading).toBe(false);
  });

  it("reset очищает ошибку", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("err"));
    const { result } = renderHook(() => useMutation(fn));

    await act(async () => { await result.current.mutate({}).catch(() => {}); });
    expect(result.current.error).toBe("err");

    act(() => { result.current.reset(); });
    expect(result.current.error).toBeNull();
  });
});
