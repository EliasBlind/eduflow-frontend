/**
 * REST-клиент для сервиса GradesService (journal.proto)
 *
 * Сгенерированные ts-proto типы:
 *   - google.protobuf.Timestamp -> JS Date (JSON.stringify сам отдаёт ISO-строку);
 *   - oneof развёрнут в плоские опциональные поля (grade?/statusCodeId?,
 *     studentId?/classId?) — отдельного объекта filter нет.
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
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

/** POST /v1/grades */
export function recordGrade(req: RecordGradeRequest): Promise<Grade> {
  // dateOfGrade (Date) сериализуется JSON.stringify в ISO; oneof-поля уже плоские.
  return http.post("/v1/grades", req);
}

/**
 * GET /v1/grades
 * Timestamp -> ISO-строка; oneof studentId/classId — обычные query-параметры.
 */
export function listGrades(req: ListGradesRequest): Promise<ListGradesResponse> {
  return http.get("/v1/grades", {
    subject_id: req.subjectId,
    student_id: req.studentId,
    class_id: req.classId,
    start: req.start?.toISOString(),
    end: req.end?.toISOString(),
  });
}

/** PUT /v1/grades/{id} */
export function updateGrade(req: UpdateGradeRequest): Promise<Grade> {
  const { gradeId, ...body } = req;
  return http.put(`/v1/grades/${gradeId}`, body);
}

/** DELETE /v1/grades/{id} */
export function deleteGrade(req: DeleteGradeRequest): Promise<Empty> {
  return http.delete(`/v1/grades/${req.id}`);
}
