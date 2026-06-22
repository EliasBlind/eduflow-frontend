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

export async function recordHomework(req: RecordHomeworkRequest): Promise<Homework> {
  return client.RecordHomework(req);
}

export async function updateHomework(req: UpdateHomeworkRequest): Promise<Homework> {
  return client.UpdateHomework(req);
}

export async function listHomework(req: ListHomeworkRequest): Promise<ListHomeworkResponse> {
  return client.ListHomework(req);
}

export async function deleteHomework(req: DeleteHomeworkRequest): Promise<Empty> {
  return client.DeleteHomework(req);
}
