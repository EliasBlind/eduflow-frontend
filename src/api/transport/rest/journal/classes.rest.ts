/**
 * REST-клиент для сервиса ClassesService (journal.proto)
 */

import { http } from "../_client";
import type {
  CreateClassRequest,
  GetClassRequest,
  ListTeacherClassesRequest,
  ListClassesResponse,
  UpdateClassRequest,
  Class,
  DeleteClassRequest
} from "../../../gen/journal/journal";

/** POST /v1/classes */
export function createClass(req: CreateClassRequest): Promise<Class> {
  return http.post("/v1/classes", req);
}

/** GET /v1/classes/{id} */
export function getClass(req: GetClassRequest): Promise<Class> {
  return http.get(`/v1/classes/${req.id}`);
}

/** GET /v1/classes */
export function listClasses(): Promise<ListClassesResponse> {
  return http.get("/v1/classes");
}

/** GET /v1/teachers/{teacher_id}/classes */
export function listTeacherClasses(req: ListTeacherClassesRequest): Promise<ListClassesResponse> {
  const { teacherId, limit, offset } = req;
  return http.get(`/v1/teachers/${teacherId}/classes`, { limit, offset });
}

/** PUT /v1/classes/{id} */
export function updateClass(req: UpdateClassRequest): Promise<Class> {
  const { id, ...body } = req;
  return http.put(`/v1/classes/${id}`, body);
}

/** DELETE /v1/classes/{id} */
export function deleteClass(req: DeleteClassRequest): Promise<void> {
  return http.delete(`/v1/classes/${req.id}`);
}
