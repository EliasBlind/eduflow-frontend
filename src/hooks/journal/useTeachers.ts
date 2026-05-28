import { teachers } from "@/api/client";
import type {
  ListTeachersRequest,
  CreateTeacherRequest,
  UpdateTeacherRequest,
  DeleteTeacherRequest,
} from "@/api/gen/journal/journal";
import { useQuery    } from "./useQuery";
import { useMutation } from "./useMutation";

export function useTeachers(params: ListTeachersRequest) {
  return useQuery(
    () => teachers.listTeachers(params),
    { deps: [params.limit, params.offset] },
  );
}

export function useCreateTeacher() {
  return useMutation((params: CreateTeacherRequest) => teachers.createTeacher(params));
}

export function useUpdateTeacher() {
  return useMutation((params: UpdateTeacherRequest) => teachers.updateTeacher(params));
}

export function useDeleteTeacher() {
  return useMutation((params: DeleteTeacherRequest) => teachers.deleteTeacher(params).then(() => {}));
}
