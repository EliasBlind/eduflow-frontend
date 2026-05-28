import { grades } from "@/api/client";
import type {
  ListGradesRequest,
  RecordGradeRequest,
  UpdateGradeRequest,
  DeleteGradeRequest,
} from "@/api/gen/journal/journal";
import { useQuery    } from "./useQuery";
import { useMutation } from "./useMutation";

export function useGrades(params: ListGradesRequest) {
  return useQuery(
    () => grades.listGrades(params),
    { deps: [params.studentId, params.classId, params.subjectId, params.start, params.end] },
  );
}

export function useRecordGrade() {
  return useMutation((params: RecordGradeRequest) => grades.recordGrade(params));
}

export function useUpdateGrade() {
  return useMutation((params: UpdateGradeRequest) => grades.updateGrade(params));
}

export function useDeleteGrade() {
  return useMutation((params: DeleteGradeRequest) => grades.deleteGrade(params).then(() => {}));
}
