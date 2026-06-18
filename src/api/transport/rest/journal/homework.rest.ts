/**
 * REST-клиент для сервиса HomeworkService (journal.proto)
 *
 * start/end — google.protobuf.Timestamp, в ts-proto это JS Date.
 * В теле JSON.stringify сам отдаёт ISO-строку; для query вызываем toISOString().
 */

import { http } from "../_client";
import type {
  RecordHomeworkRequest,
  UpdateHomeworkRequest,
  ListHomeworkRequest,
  ListHomeworkResponse,
  Homework,
  DeleteHomeworkRequest,
} from "../../../gen/journal/journal";
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

/** POST /v1/homework */
export function recordHomework(req: RecordHomeworkRequest): Promise<Homework> {
  return http.post("/v1/homework", req);
}

/** PUT /v1/homework/{id} */
export function updateHomework(req: UpdateHomeworkRequest): Promise<Homework> {
  const { id, ...body } = req;
  return http.put(`/v1/homework/${id}`, body);
}

/** GET /v1/classes/{class_id}/homework */
export function listHomework(req: ListHomeworkRequest): Promise<ListHomeworkResponse> {
  const { classId, subjectId, start, end } = req;
  return http.get(`/v1/classes/${classId}/homework`, {
    subject_id: subjectId,
    start: start?.toISOString(),
    end: end?.toISOString(),
  });
}

/** DELETE /v1/homework/{id} */
export function deleteHomework(req: DeleteHomeworkRequest): Promise<Empty> {
  return http.delete(`/v1/homework/${req.id}`);
}
