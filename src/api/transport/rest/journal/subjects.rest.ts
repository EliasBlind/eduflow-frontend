/**
 * REST-клиент для сервиса SubjectService (journal.proto)
 */

import { http } from "../_client";
import type {
  CreateSubjectRequest,
  UpdateSubjectRequest,
  ListSubjectsResponse,
  Subject,
  DeleteSubjectRequest
} from "../../../gen/journal/journal";

/** POST /v1/subjects */
export function createSubject(req: CreateSubjectRequest): Promise<Subject> {
  return http.post("/v1/subjects", req);
}

/** GET /v1/subjects */
export function listSubjects(): Promise<ListSubjectsResponse> {
  return http.get("/v1/subjects");
}

/** PUT /v1/subjects/{id} */
export function updateSubject(req: UpdateSubjectRequest): Promise<Subject> {
  const { id, ...body } = req;
  return http.put(`/v1/subjects/${id}`, body);
}

/** DELETE /v1/subjects/{id} */
export function deleteSubject(req: DeleteSubjectRequest): Promise<void> {
  return http.delete(`/v1/subjects/${req.id}`);
}
