import { http } from "../_client";
import type {
  CreateTeacherRequest,
  ListTeachersRequest,
  ListTeachersResponse,
  UpdateTeacherRequest,
  DeleteTeacherRequest,
  Teacher,
} from "../../../gen/journal/journal";
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

export function createTeacher(req: CreateTeacherRequest): Promise<Teacher> {
  return http.post("/v1/teachers", req);
}

export function listTeachers(req: ListTeachersRequest): Promise<ListTeachersResponse> {
  const { limit, offset } = req;
  return http.get("/v1/teachers", { limit, offset });
}

export function updateTeacher(req: UpdateTeacherRequest): Promise<Teacher> {
  const { id, ...body } = req;
  return http.put(`/v1/teachers/${id}`, body);
}

export function deleteTeacher(req: DeleteTeacherRequest): Promise<Empty> {
  return http.delete(`/v1/teachers/${req.id}`);
}
