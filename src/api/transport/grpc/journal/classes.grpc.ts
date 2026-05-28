/**
 * gRPC-клиент для сервиса ClassesService (journal.proto)
 */

import { rpc } from "../_client";
import { ClassesServiceClientImpl } from "../../../gen/journal/journal";
import type {
  CreateClassRequest,
  GetClassRequest,
  ListClassesRequest,
  ListTeacherClassesRequest,
  ListClassesResponse,
  UpdateClassRequest,
  DeleteClassRequest,
  Class,
} from "../../../gen/journal/journal";
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

const client = new ClassesServiceClientImpl(rpc);

/**
 * Создать класс.
 * `graduationYear` вычисляется сервером если не передан: yearOfStudy + текущий год.
 */
export async function createClass(req: CreateClassRequest): Promise<Class> {
  return client.CreateClass(req);
}

/** Получить класс по UUID. */
export async function getClass(req: GetClassRequest): Promise<Class> {
  return client.GetClass(req);
}

/** Список всех классов. */
export async function listClasses(req: ListClassesRequest): Promise<ListClassesResponse> {
  return client.ListClasses(req);
}

/** Классы конкретного учителя (с пагинацией). */
export async function listTeacherClasses(
  req: ListTeacherClassesRequest,
): Promise<ListClassesResponse> {
  return client.ListTeacherClasses(req);
}

/** Обновить данные класса. Все поля кроме `id` — опциональны. */
export async function updateClass(req: UpdateClassRequest): Promise<Class> {
  return client.UpdateClass(req);
}

/** Удалить класс по UUID. */
export async function deleteClass(req: DeleteClassRequest): Promise<Empty> {
  return client.DeleteClass(req);
}
