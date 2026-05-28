/**
 * gRPC-клиент для сервиса TeacherService (journal.proto)
 */

import { rpc } from "../_client";
import { TeacherServiceClientImpl } from "../../../gen/journal/journal";
import type {
  CreateTeacherRequest,
  ListTeachersRequest,
  ListTeachersResponse,
  UpdateTeacherRequest,
  DeleteTeacherRequest,
  Teacher,
} from "../../../gen/journal/journal";
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

const client = new TeacherServiceClientImpl(rpc);

/** Создать учителя. `id` — опционален. */
export async function createTeacher(req: CreateTeacherRequest): Promise<Teacher> {
  return client.CreateTeacher(req);
}

/** Список всех учителей с пагинацией. */
export async function listTeachers(req: ListTeachersRequest): Promise<ListTeachersResponse> {
  return client.ListTeachers(req);
}

/** Обновить ФИО учителя. */
export async function updateTeacher(req: UpdateTeacherRequest): Promise<Teacher> {
  return client.UpdateTeacher(req);
}

/** Удалить учителя по UUID. */
export async function deleteTeacher(req: DeleteTeacherRequest): Promise<Empty> {
  return client.DeleteTeacher(req);
}
