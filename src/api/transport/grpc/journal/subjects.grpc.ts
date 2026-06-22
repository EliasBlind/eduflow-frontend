import { rpc } from "../_client";
import { SubjectServiceClientImpl } from "../../../gen/journal/journal";
import type {
  CreateSubjectRequest,
  UpdateSubjectRequest,
  ListSubjectsRequest,
  ListSubjectsResponse,
  DeleteSubjectRequest,
  Subject,
} from "../../../gen/journal/journal";
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

const client = new SubjectServiceClientImpl(rpc);

export async function createSubject(req: CreateSubjectRequest): Promise<Subject> {
  return client.CreateSubject(req);
}

export async function updateSubject(req: UpdateSubjectRequest): Promise<Subject> {
  return client.UpdateSubject(req);
}

export async function listSubjects(req: ListSubjectsRequest): Promise<ListSubjectsResponse> {
  return client.ListSubjects(req);
}

export async function deleteSubject(req: DeleteSubjectRequest): Promise<Empty> {
  return client.DeleteSubject(req);
}
