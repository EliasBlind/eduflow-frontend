/**
 * REST-клиент для сервиса TeachingLoadService (journal.proto)
 *
 * oneof filter { teacherId | classId } в ts-proto развёрнут в плоские
 * опциональные поля teacherId?/classId? — передаём их как query-параметры.
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
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

/** POST /v1/teaching-loads */
export function createTeachingLoad(req: CreateTeachingLoadRequest): Promise<TeachingLoad> {
  return http.post("/v1/teaching-loads", req);
}

/** GET /v1/teaching-loads/{id} */
export function getTeachingLoad(req: GetTeachingLoadRequest): Promise<TeachingLoad> {
  return http.get(`/v1/teaching-loads/${req.id}`);
}

/** GET /v1/teaching-loads (фильтр: teacherId или classId) */
export function listTeachingLoad(req: ListTeachingLoadRequest): Promise<ListTeachingLoadResponse> {
  return http.get("/v1/teaching-loads", {
    teacher_id: req.teacherId,
    class_id: req.classId,
  });
}

/** PUT /v1/teaching-loads/{id} */
export function updateTeachingLoad(req: UpdateTeachingLoadRequest): Promise<TeachingLoad> {
  const { id, ...body } = req;
  return http.put(`/v1/teaching-loads/${id}`, body);
}

/** DELETE /v1/teaching-loads/{id} */
export function deleteTeachingLoad(req: DeleteTeachingLoadRequest): Promise<Empty> {
  return http.delete(`/v1/teaching-loads/${req.id}`);
}
