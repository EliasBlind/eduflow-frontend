import { http } from "../_client";
import type {
  CreateSubjectRequest,
  UpdateSubjectRequest,
  ListSubjectsResponse,
  Subject,
  DeleteSubjectRequest,
} from "../../../gen/journal/journal";
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

export function createSubject(req: CreateSubjectRequest): Promise<Subject> {
  return http.post("/v1/subjects", req);
}

export function listSubjects(): Promise<ListSubjectsResponse> {
  return http.get("/v1/subjects");
}

export function updateSubject(req: UpdateSubjectRequest): Promise<Subject> {
  const { id, ...body } = req;
  return http.put(`/v1/subjects/${id}`, body);
}

export function deleteSubject(req: DeleteSubjectRequest): Promise<Empty> {
  return http.delete(`/v1/subjects/${req.id}`);
}
