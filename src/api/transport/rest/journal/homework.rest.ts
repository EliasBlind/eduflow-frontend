/**
 * REST-клиент для сервиса HomeworkService (journal.proto)
 */

import { http } from "../_client";
import type {
  RecordHomeworkRequest,
  UpdateHomeworkRequest,
  ListHomeworkRequest,
  ListHomeworkResponse,
  Homework,
  DeleteHomeworkRequest,
} from "@/api/gen/journal/journal";

/** POST /v1/homework */
export function recordHomework(req: RecordHomeworkRequest): Promise<Homework> {
  return http.post("/v1/homework", req);
}

/** PUT /v1/homework/{id} */
export function updateHomework(req: UpdateHomeworkRequest): Promise<Homework> {
  const { id, ...body } = req;
  return http.put(`/v1/homework/${id}`, body);
}

/**
 * GET /v1/classes/{class_id}/homework
 * start/end — Timestamp, передаём как ISO-строки в query.
 */
export function listHomework(req: ListHomeworkRequest): Promise<ListHomeworkResponse> {
  const { classId, subjectId, start, end } = req;
  return http.get(`/v1/classes/${classId}/homework`, {
    subject_id: subjectId,
    start: start ? new Date(Number(start.seconds) * 1000).toISOString() : undefined,
    end: end ? new Date(Number(end.seconds) * 1000).toISOString() : undefined,
  });
}

/** DELETE /v1/homework/{id} */
export function deleteHomework(req: DeleteHomeworkRequest): Promise<void> {
  return http.delete(`/v1/homework/${req.id}`);
}
