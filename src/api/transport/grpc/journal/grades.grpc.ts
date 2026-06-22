import { rpc } from "../_client";
import { GradesServiceClientImpl } from "../../../gen/journal/journal";
import type {
  RecordGradeRequest,
  ListGradesRequest,
  ListGradesResponse,
  UpdateGradeRequest,
  DeleteGradeRequest,
  Grade,
} from "../../../gen/journal/journal";
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

const client = new GradesServiceClientImpl(rpc);

export async function recordGrade(req: RecordGradeRequest): Promise<Grade> {
  return client.RecordGrade(req);
}

export async function listGrades(req: ListGradesRequest): Promise<ListGradesResponse> {
  return client.ListGrades(req);
}

export async function updateGrade(req: UpdateGradeRequest): Promise<Grade> {
  return client.UpdateGrade(req);
}

export async function deleteGrade(req: DeleteGradeRequest): Promise<Empty> {
  return client.DeleteGrade(req);
}
