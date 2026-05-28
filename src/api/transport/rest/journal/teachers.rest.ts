/**
 * REST-клиент для сервиса TeacherService (journal.proto)
 */

import { http } from "../_client";
import type {
  CreateTeacherRequest,
  ListTeachersRequest,
  ListTeachersResponse,
  UpdateTeacherRequest,
  DeleteTeacherRequest,
  Teacher,
} from "../../../gen/journal/journal";

/** POST /v1/teachers */
export function createTeacher(req: CreateTeacherRequest): Promise<Teacher> {
  return http.post("/v1/teachers", req);
}

/** GET /v1/teachers */
export function listTeachers(req: ListTeachersRequest): Promise<ListTeachersResponse> {
  const { limit, offset } = req;
  return http.get("/v1/teachers", { limit, offset });
}

/** PUT /v1/teachers/{id} */
export function updateTeacher(req: UpdateTeacherRequest): Promise<Teacher> {
  const { id, ...body } = req;
  return http.put(`/v1/teachers/${id}`, body);
}

/** DELETE /v1/teachers/{id} */
export function deleteTeacher(req: DeleteTeacherRequest): Promise<void> {
  return http.delete(`/v1/teachers/${req.id}`);
}
