/**
 * gRPC-клиент для сервиса TeachingLoadService (journal.proto)
 *
 * TeachingLoad — связь учитель + предмет + класс.
 * Его id используется как tsId при выставлении оценок.
 *
 * oneof filter { teacherId | classId } в ts-proto:
 *   { $case: "teacherId"; teacherId: string }
 * | { $case: "classId"; classId: string }
 * | undefined
 */

import { rpc } from "../_client";
import { TeachingLoadServiceClientImpl } from "../../../gen/journal/journal";
import type {
  CreateTeachingLoadRequest,
  GetTeachingLoadRequest,
  ListTeachingLoadRequest,
  ListTeachingLoadResponse,
  UpdateTeachingLoadRequest,
  DeleteTeachingLoadRequest,
  TeachingLoad,
} from "../../../gen/journal/journal";
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

const client = new TeachingLoadServiceClientImpl(rpc);

/** Назначить учителя вести предмет в классе. */
export async function createTeachingLoad(
  req: CreateTeachingLoadRequest,
): Promise<TeachingLoad> {
  return client.CreateTeachingLoad(req);
}

/** Получить запись о нагрузке по UUID. */
export async function getTeachingLoad(req: GetTeachingLoadRequest): Promise<TeachingLoad> {
  return client.GetTeachingLoad(req);
}

/**
 * Список записей о нагрузке.
 *
 * По учителю:
 * ```ts
 * await listTeachingLoad({ filter: { $case: "teacherId", teacherId: "<uuid>" } })
 * ```
 * По классу:
 * ```ts
 * await listTeachingLoad({ filter: { $case: "classId", classId: "<uuid>" } })
 * ```
 */
export async function listTeachingLoad(
  req: ListTeachingLoadRequest,
): Promise<ListTeachingLoadResponse> {
  return client.ListTeachingLoad(req);
}

/** Заменить учителя в записи о нагрузке. */
export async function updateTeachingLoad(
  req: UpdateTeachingLoadRequest,
): Promise<TeachingLoad> {
  return client.UpdateTeachingLoad(req);
}

/** Удалить запись о нагрузке по UUID. */
export async function deleteTeachingLoad(req: DeleteTeachingLoadRequest): Promise<Empty> {
  return client.DeleteTeachingLoad(req);
}
