import { subjects } from "@/api/client";
import type {
  CreateSubjectRequest,
  UpdateSubjectRequest,
  DeleteSubjectRequest,
} from "@/api/gen/journal/journal";
import { useQuery    } from "./useQuery";
import { useMutation } from "./useMutation";

export function useSubjects() {
  return useQuery(() => subjects.listSubjects({}));
}
export function useCreateSubject() {
  return useMutation((params: CreateSubjectRequest) => subjects.createSubject(params));
}

export function useUpdateSubject() {
  return useMutation((params: UpdateSubjectRequest) => subjects.updateSubject(params));
}

export function useDeleteSubject() {
  return useMutation((params: DeleteSubjectRequest) => subjects.deleteSubject(params).then(() => {}));
}
