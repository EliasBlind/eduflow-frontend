import { renderHook, act, waitFor } from "@testing-library/react";
import { students } from "@/api/client";
import {
  useStudents,
  useStudent,
  useCreateStudent,
  useDeleteStudent,
} from "@/hooks/journal/useStudents";
import { describe, it, vi, expect, beforeEach } from "vitest";

vi.mock("@/api/client", () => ({
  students: {
    listStudents:  vi.fn(),
    getStudent:    vi.fn(),
    createStudent: vi.fn(),
    updateStudent: vi.fn(),
    deleteStudent: vi.fn(),
  },
}));

const mock = vi.mocked(students);

beforeEach(() => { vi.clearAllMocks(); });

describe("useStudents", () => {
  it("загружает список студентов", async () => {
    const data = { totalCount: 1, students: [{ id: "1", fullName: "Иван" }] };
    mock.listStudents.mockResolvedValue(data);

    const { result } = renderHook(() =>
      useStudents({ classId: "cls-1", limit: 10, offset: 0 })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(data);
  });
});

describe("useStudent", () => {
  it("skip = true когда studentId пустой", () => {
    renderHook(() => useStudent({ studentId: "" }));
    expect(mock.getStudent).not.toHaveBeenCalled();
  });

  it("загружает студента по studentId", async () => {
    mock.getStudent.mockResolvedValue({ id: "1", fullName: "Иван" });

    const { result } = renderHook(() => useStudent({ studentId: "1" }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual({ id: "1", fullName: "Иван" });
  });
});

describe("useCreateStudent", () => {
  it("вызывает createStudent и возвращает результат", async () => {
    mock.createStudent.mockResolvedValue({ id: "new", fullName: "Петя" });

    const { result } = renderHook(() => useCreateStudent());
    let res;
    await act(async () => {
      res = await result.current.mutate({ fullName: "Петя" });
    });

    expect(res).toEqual({ id: "new", fullName: "Петя" });
  });
});

describe("useDeleteStudent", () => {
  it("вызывает deleteStudent и возвращает void", async () => {
    mock.deleteStudent.mockResolvedValue({});

    const { result } = renderHook(() => useDeleteStudent());
    await act(async () => {
      await result.current.mutate({ id: "1" });
    });

    expect(mock.deleteStudent).toHaveBeenCalledWith({ id: "1" });
    expect(result.current.error).toBeNull();
  });
});
