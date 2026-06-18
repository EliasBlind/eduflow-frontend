/**
 * REST-клиент для сервиса SubjectService (journal.proto)
 */

import { http } from "../_client";
import type {
  CreateSubjectRequest,
  UpdateSubjectRequest,
  ListSubjectsRequest,
  ListSubjectsResponse,
  Subject,
  DeleteSubjectRequest,
} from "../../../gen/journal/journal";
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

/** POST /v1/subjects */
export function createSubject(req: CreateSubjectRequest): Promise<Subject> {
  return http.post("/v1/subjects", req);
}

/** GET /v1/subjects */
// req нужен только для совпадения сигнатуры с gRPC; ListSubjectsRequest пустой.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function listSubjects(_req: ListSubjectsRequest = {}): Promise<ListSubjectsResponse> {
  return http.get("/v1/subjects");
}

/** PUT /v1/subjects/{id} */
export function updateSubject(req: UpdateSubjectRequest): Promise<Subject> {
  const { id, ...body } = req;
  return http.put(`/v1/subjects/${id}`, body);
}

/** DELETE /v1/subjects/{id} */
export function deleteSubject(req: DeleteSubjectRequest): Promise<Empty> {
  return http.delete(`/v1/subjects/${req.id}`);
}
