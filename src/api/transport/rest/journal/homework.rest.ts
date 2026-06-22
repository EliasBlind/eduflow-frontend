import { http } from "../_client";
import type {
  RecordHomeworkRequest,
  UpdateHomeworkRequest,
  ListHomeworkRequest,
  ListHomeworkResponse,
  Homework,
  DeleteHomeworkRequest,
} from "../../../gen/journal/journal";
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

export function recordHomework(req: RecordHomeworkRequest): Promise<Homework> {
  return http.post("/v1/homework", req);
}

export function updateHomework(req: UpdateHomeworkRequest): Promise<Homework> {
  const { id, ...body } = req;
  return http.put(`/v1/homework/${id}`, body);
}

export function listHomework(req: ListHomeworkRequest): Promise<ListHomeworkResponse> {
  const { classId, subjectId, start, end } = req;
  return http.get(`/v1/classes/${classId}/homework`, {
    subject_id: subjectId,
    start: start?.toISOString(),
    end: end?.toISOString(),
  });
}

export function deleteHomework(req: DeleteHomeworkRequest): Promise<Empty> {
  return http.delete(`/v1/homework/${req.id}`);
}
