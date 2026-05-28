/**
 * REST-клиент для сервиса GradesService (journal.proto)
 *
 * oneof filter { grade | statusCodeId } и { studentId | classId }
 * сериализуются в JSON как обычные поля — сервер разберёт по наличию ключа.
 */

import { http } from "../_client";
import type {
  RecordGradeRequest,
  ListGradesRequest,
  ListGradesResponse,
  UpdateGradeRequest,
  DeleteGradeRequest,
  Grade,
} from "../../../gen/journal/journal";

/** POST /v1/grades */
export function recordGrade(req: RecordGradeRequest): Promise<Grade> {
  return http.post("/v1/grades", req);
}

/**
 * GET /v1/grades
 * Параметры передаются как query-string.
 * oneof-поля (studentId/classId, grade/statusCodeId) — обычные query-параметры.
 */
export function listGrades(req: ListGradesRequest): Promise<ListGradesResponse> {
  // Timestamp → ISO-строка для query
  const params: Record<string, string | number | undefined> = {
    subject_id: req.subjectId,
    start: req.start ? new Date(Number(req.start.seconds) * 1000).toISOString() : undefined,
    end: req.end ? new Date(Number(req.end.seconds) * 1000).toISOString() : undefined,
  };

  if (req.filter?.$case === "studentId") params.student_id = req.filter.studentId;
  if (req.filter?.$case === "classId") params.class_id = req.filter.classId;

  return http.get("/v1/grades", params);
}

/** PUT /v1/grades/{id} */
export function updateGrade(req: UpdateGradeRequest): Promise<Grade> {
  const { gradeId, ...body } = req;
  return http.put(`/v1/grades/${gradeId}`, body);
}

/** DELETE /v1/grades/{id} */
export function deleteGrade(req: DeleteGradeRequest): Promise<void> {
  return http.delete(`/v1/grades/${req.id}`);
}
