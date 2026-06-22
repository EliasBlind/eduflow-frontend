import { rpc } from "../_client";
import { TeacherServiceClientImpl } from "../../../gen/journal/journal";
import type {
  CreateTeacherRequest,
  ListTeachersRequest,
  ListTeachersResponse,
  UpdateTeacherRequest,
  DeleteTeacherRequest,
  Teacher,
} from "../../../gen/journal/journal";
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

const client = new TeacherServiceClientImpl(rpc);

export async function createTeacher(req: CreateTeacherRequest): Promise<Teacher> {
  return client.CreateTeacher(req);
}

export async function listTeachers(req: ListTeachersRequest): Promise<ListTeachersResponse> {
  return client.ListTeachers(req);
}

export async function updateTeacher(req: UpdateTeacherRequest): Promise<Teacher> {
  return client.UpdateTeacher(req);
}

export async function deleteTeacher(req: DeleteTeacherRequest): Promise<Empty> {
  return client.DeleteTeacher(req);
}
