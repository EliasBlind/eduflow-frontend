/**
 * REST-клиент для сервиса StatusCodeService (journal.proto)
 */

import { http } from "../_client";
import type {
  CreateStatusCodeRequest,
  UpdateStatusCodeRequest,
  ListStatusCodeRequest,
  ListStatusCodeResponse,
  StatusCode,
  DeleteStatusCodeRequest,
} from "../../../gen/journal/journal";
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

/** POST /v1/status-codes */
export function createStatusCode(req: CreateStatusCodeRequest): Promise<StatusCode> {
  return http.post("/v1/status-codes", req);
}

/** GET /v1/status-codes */
// req нужен только для совпадения сигнатуры с gRPC; ListStatusCodeRequest пустой.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function listStatusCode(_req: ListStatusCodeRequest = {}): Promise<ListStatusCodeResponse> {
  return http.get("/v1/status-codes");
}

/** PUT /v1/status-codes/{id} */
export function updateStatusCode(req: UpdateStatusCodeRequest): Promise<StatusCode> {
  const { id, ...body } = req;
  return http.put(`/v1/status-codes/${id}`, body);
}

/** DELETE /v1/status-codes/{id} */
export function deleteStatusCode(req: DeleteStatusCodeRequest): Promise<Empty> {
  return http.delete(`/v1/status-codes/${req.id}`);
}
