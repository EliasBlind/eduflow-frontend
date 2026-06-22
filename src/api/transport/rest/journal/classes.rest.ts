import { http } from "../_client";
import type {
  CreateClassRequest,
  GetClassRequest,
  ListTeacherClassesRequest,
  ListClassesResponse,
  UpdateClassRequest,
  Class,
  DeleteClassRequest,
} from "../../../gen/journal/journal";
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

export function createClass(req: CreateClassRequest): Promise<Class> {
  return http.post("/v1/classes", req);
}

export function getClass(req: GetClassRequest): Promise<Class> {
  return http.get(`/v1/classes/${req.id}`);
}

export function listClasses(): Promise<ListClassesResponse> {
  return http.get("/v1/classes");
}

export function listTeacherClasses(req: ListTeacherClassesRequest): Promise<ListClassesResponse> {
  const { teacherId, limit, offset } = req;
  return http.get(`/v1/teachers/${teacherId}/classes`, { limit, offset });
}

export function updateClass(req: UpdateClassRequest): Promise<Class> {
  const { id, ...body } = req;
  return http.put(`/v1/classes/${id}`, body);
}

export function deleteClass(req: DeleteClassRequest): Promise<Empty> {
  return http.delete(`/v1/classes/${req.id}`);
}
