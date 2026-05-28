/**
 * gRPC-клиент для сервиса SubjectService (journal.proto)
 */

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

/** Создать предмет. */
export async function createSubject(req: CreateSubjectRequest): Promise<Subject> {
  return client.CreateSubject(req);
}

/** Обновить название предмета. */
export async function updateSubject(req: UpdateSubjectRequest): Promise<Subject> {
  return client.UpdateSubject(req);
}

/** Список всех предметов. */
export async function listSubjects(req: ListSubjectsRequest): Promise<ListSubjectsResponse> {
  return client.ListSubjects(req);
}

/** Удалить предмет по UUID. */
export async function deleteSubject(req: DeleteSubjectRequest): Promise<Empty> {
  return client.DeleteSubject(req);
}
