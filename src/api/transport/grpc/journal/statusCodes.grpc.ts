/**
 * gRPC-клиент для сервиса StatusCodeService (journal.proto)
 *
 * Статус-коды — справочник нестандартных отметок ("н", "б" и т.д.).
 * UUID статус-кода используется в GradesService.RecordGrade вместо числовой оценки.
 */

import { rpc } from "../_client";
import { StatusCodeServiceClientImpl } from "../../../gen/journal/journal";
import type {
  CreateStatusCodeRequest,
  UpdateStatusCodeRequest,
  ListStatusCodeRequest,
  ListStatusCodeResponse,
  DeleteStatusCodeRequest,
  StatusCode,
} from "../../../gen/journal/journal";
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

const client = new StatusCodeServiceClientImpl(rpc);

/** Создать новый статус-код. */
export async function createStatusCode(req: CreateStatusCodeRequest): Promise<StatusCode> {
  return client.CreateStatusCode(req);
}

/** Обновить название статус-кода. */
export async function updateStatusCode(req: UpdateStatusCodeRequest): Promise<StatusCode> {
  return client.UpdateStatusCode(req);
}

/** Список всех статус-кодов. */
export async function listStatusCode(req: ListStatusCodeRequest): Promise<ListStatusCodeResponse> {
  return client.ListStatusCode(req);
}

/** Удалить статус-код по UUID. */
export async function deleteStatusCode(req: DeleteStatusCodeRequest): Promise<Empty> {
  return client.DeleteStatusCode(req);
}
