import { students } from "@/api/client";
import type {
  ListStudentsRequest,
  GetStudentRequest,
  CreateStudentRequest,
  UpdateStudentRequest,
  DeleteStudentRequest,
} from "@/api/gen/journal/journal";
import { useQuery    } from "./useQuery";
import { useMutation } from "./useMutation";

export function useStudents(params: ListStudentsRequest) {
  return useQuery(
    () => students.listStudents(params),
    { deps: [params.classId, params.limit, params.offset] },
  );
}

/** Один студент по id */
export function useStudent(params: GetStudentRequest) {
  return useQuery(() => students.getStudent(params), {
    skip: !params.studentId,
    deps: [params.studentId],
  });
}

/** Создание студента */
export function useCreateStudent() {
  return useMutation((params: CreateStudentRequest) => students.createStudent(params));
}

/** Обновление студента */
export function useUpdateStudent() {
  return useMutation((params: UpdateStudentRequest) => students.updateStudent(params));
}

/** Удаление студента */
export function useDeleteStudent() {
  return useMutation((params: DeleteStudentRequest) => students.deleteStudent(params).then(() => {}));
}
