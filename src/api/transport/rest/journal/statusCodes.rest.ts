/**
 * REST-клиент для сервиса StatusCodeService (journal.proto)
 */

import { http } from "../_client";
import type {
  CreateStatusCodeRequest,
  UpdateStatusCodeRequest,
  ListStatusCodeResponse,
  StatusCode,
  DeleteStatusCodeRequest,
} from "../../../gen/journal/journal";

/** POST /v1/status-codes */
export function createStatusCode(req: CreateStatusCodeRequest): Promise<StatusCode> {
  return http.post("/v1/status-codes", req);
}

/** GET /v1/status-codes */
export function listStatusCode(): Promise<ListStatusCodeResponse> {
  return http.get("/v1/status-codes");
}

/** PUT /v1/status-codes/{id} */
export function updateStatusCode(req: UpdateStatusCodeRequest): Promise<StatusCode> {
  const { id, ...body } = req;
  return http.put(`/v1/status-codes/${id}`, body);
}

/** DELETE /v1/status-codes/{id} */
export function deleteStatusCode(req: DeleteStatusCodeRequest): Promise<void> {
  return http.delete(`/v1/status-codes/${req.id}`);
}
