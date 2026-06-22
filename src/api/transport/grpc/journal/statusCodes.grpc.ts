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

export async function createStatusCode(req: CreateStatusCodeRequest): Promise<StatusCode> {
  return client.CreateStatusCode(req);
}

export async function updateStatusCode(req: UpdateStatusCodeRequest): Promise<StatusCode> {
  return client.UpdateStatusCode(req);
}

export async function listStatusCode(req: ListStatusCodeRequest): Promise<ListStatusCodeResponse> {
  return client.ListStatusCode(req);
}

export async function deleteStatusCode(req: DeleteStatusCodeRequest): Promise<Empty> {
  return client.DeleteStatusCode(req);
}
