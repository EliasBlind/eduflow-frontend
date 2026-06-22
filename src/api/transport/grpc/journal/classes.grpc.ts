import { rpc } from "../_client";
import { ClassesServiceClientImpl } from "../../../gen/journal/journal";
import type {
  CreateClassRequest,
  GetClassRequest,
  ListClassesRequest,
  ListTeacherClassesRequest,
  ListClassesResponse,
  UpdateClassRequest,
  DeleteClassRequest,
  Class,
} from "../../../gen/journal/journal";
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

const client = new ClassesServiceClientImpl(rpc);
export async function createClass(req: CreateClassRequest): Promise<Class> {
  return client.CreateClass(req);
}

export async function getClass(req: GetClassRequest): Promise<Class> {
  return client.GetClass(req);
}

export async function listClasses(req: ListClassesRequest): Promise<ListClassesResponse> {
  return client.ListClasses(req);
}

export async function listTeacherClasses(
  req: ListTeacherClassesRequest,
): Promise<ListClassesResponse> {
  return client.ListTeacherClasses(req);
}

export async function updateClass(req: UpdateClassRequest): Promise<Class> {
  return client.UpdateClass(req);
}

export async function deleteClass(req: DeleteClassRequest): Promise<Empty> {
  return client.DeleteClass(req);
}
