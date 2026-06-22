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

export function createTeachingLoad(req: CreateTeachingLoadRequest): Promise<TeachingLoad> {
  return http.post("/v1/teaching-loads", req);
}

export function getTeachingLoad(req: GetTeachingLoadRequest): Promise<TeachingLoad> {
  return http.get(`/v1/teaching-loads/${req.id}`);
}

export function listTeachingLoad(req: ListTeachingLoadRequest): Promise<ListTeachingLoadResponse> {
  return http.get("/v1/teaching-loads", {
    teacher_id: req.teacherId,
    class_id: req.classId,
  });
}

export function updateTeachingLoad(req: UpdateTeachingLoadRequest): Promise<TeachingLoad> {
  const { id, ...body } = req;
  return http.put(`/v1/teaching-loads/${id}`, body);
}

export function deleteTeachingLoad(req: DeleteTeachingLoadRequest): Promise<Empty> {
  return http.delete(`/v1/teaching-loads/${req.id}`);
}
