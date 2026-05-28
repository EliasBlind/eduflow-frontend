import { renderHook, act, waitFor } from "@testing-library/react";
import { classes } from "@/api/client";
import { useClasses, useClass, useDeleteClass } from "@/hooks/journal/useClasses";
import { describe, it, vi, expect, beforeEach } from "vitest";

vi.mock("@/api/client", () => ({
  classes: {
    listClasses:  vi.fn(),
    getClass:     vi.fn(),
    createClass:  vi.fn(),
    updateClass:  vi.fn(),
    deleteClass:  vi.fn(),
  },
}));

const mock = vi.mocked(classes);

beforeEach(() => { vi.clearAllMocks(); });

describe("useClasses", () => {
  it("загружает список классов", async () => {
    const data = { totalCount: 2, classes: [] };
    mock.listClasses.mockResolvedValue(data);

    const { result } = renderHook(() => useClasses());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(data);
  });
});

describe("useClass", () => {
  it("skip когда id пустой", () => {
    renderHook(() => useClass({ id: "" }));
    expect(mock.getClass).not.toHaveBeenCalled();
  });

  it("загружает класс по id", async () => {
    mock.getClass.mockResolvedValue({
      id: "cls-1",
      className: "11А",
      yearOfStudy: 11,
      graduationYear: 2030,
    });

    const { result } = renderHook(() => useClass({ id: "cls-1" }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toMatchObject({ className: "11А" });
  });
});

describe("useDeleteClass", () => {
  it("вызывает deleteClass", async () => {
    mock.deleteClass.mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteClass());
    await act(async () => { await result.current.mutate({ id: "cls-1" }); });

    expect(mock.deleteClass).toHaveBeenCalledWith({ id: "cls-1" });
  });
});
