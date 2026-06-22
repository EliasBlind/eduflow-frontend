import { http } from "../_client";
import type {
  RecordGradeRequest,
  ListGradesRequest,
  ListGradesResponse,
  UpdateGradeRequest,
  DeleteGradeRequest,
  Grade,
} from "../../../gen/journal/journal";
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

export function recordGrade(req: RecordGradeRequest): Promise<Grade> {
  return http.post("/v1/grades", req);
}
export function listGrades(req: ListGradesRequest): Promise<ListGradesResponse> {
  return http.get("/v1/grades", {
    subject_id: req.subjectId,
    student_id: req.studentId,
    class_id: req.classId,
    start: req.start?.toISOString(),
    end: req.end?.toISOString(),
  });
}

export function updateGrade(req: UpdateGradeRequest): Promise<Grade> {
  const { gradeId, ...body } = req;
  return http.put(`/v1/grades/${gradeId}`, body);
}

export function deleteGrade(req: DeleteGradeRequest): Promise<Empty> {
  return http.delete(`/v1/grades/${req.id}`);
}
