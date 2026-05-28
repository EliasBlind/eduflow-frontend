/**
 * gRPC-клиент для сервиса HomeworkService (journal.proto)
 */

import { rpc } from "../_client";
import { HomeworkServiceClientImpl } from "../../../gen/journal/journal";
import type {
  RecordHomeworkRequest,
  UpdateHomeworkRequest,
  ListHomeworkRequest,
  ListHomeworkResponse,
  DeleteHomeworkRequest,
  Homework,
} from "../../../gen/journal/journal";
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

const client = new HomeworkServiceClientImpl(rpc);

/** Создать домашнее задание. `start` и `end` — опциональны. */
export async function recordHomework(req: RecordHomeworkRequest): Promise<Homework> {
  return client.RecordHomework(req);
}

/** Обновить домашнее задание. Все поля кроме `id` — опциональны. */
export async function updateHomework(req: UpdateHomeworkRequest): Promise<Homework> {
  return client.UpdateHomework(req);
}

/** Список домашних заданий для класса с фильтрацией по предмету и диапазону дат. */
export async function listHomework(req: ListHomeworkRequest): Promise<ListHomeworkResponse> {
  return client.ListHomework(req);
}

/** Удалить домашнее задание по UUID. */
export async function deleteHomework(req: DeleteHomeworkRequest): Promise<Empty> {
  return client.DeleteHomework(req);
}
