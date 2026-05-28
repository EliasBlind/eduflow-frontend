/**
 * REST-клиент для сервиса TeachingLoadService (journal.proto)
 *
 * oneof filter { teacherId | classId } передаётся как query-параметр.
 */

import { http } from "../_client";
import type {
  CreateTeachingLoadRequest,
  ListTeachingLoadRequest,
  ListTeachingLoadResponse,
  GetTeachingLoadRequest,
  UpdateTeachingLoadRequest,
  DeleteTeachingLoadRequest,
  TeachingLoad,
} from "../../../gen/journal/journal";

/** POST /v1/teaching-loads */
export function createTeachingLoad(req: CreateTeachingLoadRequest): Promise<TeachingLoad> {
  return http.post("/v1/teaching-loads", req);
}

/** GET /v1/teaching-loads/{id} */
export function getTeachingLoad(req: GetTeachingLoadRequest): Promise<TeachingLoad> {
  return http.get(`/v1/teaching-loads/${req.id}`);
}

/**
 * GET /v1/teaching-loads
 * Фильтр — oneof: teacherId или classId.
 */
export function listTeachingLoad(req: ListTeachingLoadRequest): Promise<ListTeachingLoadResponse> {
  const params: Record<string, string | undefined> = {};
  if (req.filter?.$case === "teacherId") params.teacher_id = req.filter.teacherId;
  if (req.filter?.$case === "classId") params.class_id = req.filter.classId;
  return http.get("/v1/teaching-loads", params);
}

/** PUT /v1/teaching-loads/{id} */
export function updateTeachingLoad(req: UpdateTeachingLoadRequest): Promise<TeachingLoad> {
  const { id, ...body } = req;
  return http.put(`/v1/teaching-loads/${id}`, body);
}

/** DELETE /v1/teaching-loads/{id} */
export function deleteTeachingLoad(req: DeleteTeachingLoadRequest): Promise<void> {
  return http.delete(`/v1/teaching-loads/${req.id}`);
}
