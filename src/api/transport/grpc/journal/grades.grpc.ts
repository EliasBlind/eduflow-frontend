/**
 * gRPC-клиент для сервиса GradesService (journal.proto)
 *
 * oneof filter { grade | statusCodeId } в ts-proto представлен как:
 *   { $case: "grade"; grade: number }
 * | { $case: "statusCodeId"; statusCodeId: string }
 * | undefined
 */

import { rpc } from "../_client";
import { GradesServiceClientImpl } from "../../../gen/journal/journal";
import type {
  RecordGradeRequest,
  ListGradesRequest,
  ListGradesResponse,
  UpdateGradeRequest,
  DeleteGradeRequest,
  Grade,
} from "../../../gen/journal/journal";
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

const client = new GradesServiceClientImpl(rpc);

/**
 * Выставить оценку.
 *
 * Числовая оценка:
 * ```ts
 * await recordGrade({ tsId, studentId, lessonNumber: 1,
 *   filter: { $case: "grade", grade: 5 } })
 * ```
 * Статус-код (болен, н/я и т.д.):
 * ```ts
 * await recordGrade({ tsId, studentId, lessonNumber: 1,
 *   filter: { $case: "statusCodeId", statusCodeId: "<uuid>" } })
 * ```
 */
export async function recordGrade(req: RecordGradeRequest): Promise<Grade> {
  return client.RecordGrade(req);
}

/**
 * Список оценок с фильтрацией.
 * filter — oneof: studentId | classId
 */
export async function listGrades(req: ListGradesRequest): Promise<ListGradesResponse> {
  return client.ListGrades(req);
}

/** Изменить оценку или статус-код. */
export async function updateGrade(req: UpdateGradeRequest): Promise<Grade> {
  return client.UpdateGrade(req);
}

/** Удалить оценку по UUID. */
export async function deleteGrade(req: DeleteGradeRequest): Promise<Empty> {
  return client.DeleteGrade(req);
}
