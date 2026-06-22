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

export async function createTeachingLoad(
  req: CreateTeachingLoadRequest,
): Promise<TeachingLoad> {
  return client.CreateTeachingLoad(req);
}

export async function getTeachingLoad(req: GetTeachingLoadRequest): Promise<TeachingLoad> {
  return client.GetTeachingLoad(req);
}

export async function listTeachingLoad(
  req: ListTeachingLoadRequest,
): Promise<ListTeachingLoadResponse> {
  return client.ListTeachingLoad(req);
}

export async function updateTeachingLoad(
  req: UpdateTeachingLoadRequest,
): Promise<TeachingLoad> {
  return client.UpdateTeachingLoad(req);
}

export async function deleteTeachingLoad(req: DeleteTeachingLoadRequest): Promise<Empty> {
  return client.DeleteTeachingLoad(req);
}
