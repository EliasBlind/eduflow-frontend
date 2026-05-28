import { renderHook, act, waitFor } from "@testing-library/react";
import { useQuery } from "@/hooks/journal/useQuery";
import { describe, it, vi, expect } from "vitest";

describe("useQuery", () => {
  it("загружает данные при монтировании", async () => {
    const fetcher = vi.fn().mockResolvedValue({ id: "1" });
    const { result } = renderHook(() => useQuery(fetcher));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual({ id: "1" });
    expect(result.current.error).toBeNull();
  });

  it("skip = true — запрос не выполняется", () => {
    const fetcher = vi.fn();
    renderHook(() => useQuery(fetcher, { skip: true }));

    expect(fetcher).not.toHaveBeenCalled();
  });

  it("skip = true — loading сразу false", () => {
    const { result } = renderHook(() => useQuery(vi.fn(), { skip: true }));
    expect(result.current.loading).toBe(false);
  });

  it("ошибка fetcher сохраняется в error", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("500"));
    const { result } = renderHook(() => useQuery(fetcher));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("500");
    expect(result.current.data).toBeNull();
  });

  it("refetch повторяет запрос", async () => {
    const fetcher = vi.fn().mockResolvedValue("first");
    const { result } = renderHook(() => useQuery(fetcher));
    await waitFor(() => expect(result.current.loading).toBe(false));

    fetcher.mockResolvedValue("second");
    act(() => { result.current.refetch(); });

    await waitFor(() => expect(result.current.data).toBe("second"));
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("deps — повторный запрос при изменении", async () => {
    const fetcher = vi.fn().mockResolvedValue("data");
    let id = "1";
    const { result, rerender } = renderHook(() =>
      useQuery(fetcher, { deps: [id] })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));

    id = "2";
    rerender();
    await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
  });

  it("отменяет устаревший запрос при размонтировании", async () => {
    let resolve!: (v: any) => void;
    const fetcher = vi.fn().mockReturnValue(new Promise((r) => { resolve = r; }));
    const { result, unmount } = renderHook(() => useQuery(fetcher));

    unmount();
    act(() => { resolve("late data"); });

    expect(result.current.data).toBeNull();
  });
});
