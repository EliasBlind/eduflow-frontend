import { rpc } from "../_client";
import { StudentServiceClientImpl } from "../../../gen/journal/journal";
import type {
  CreateStudentRequest,
  GetStudentRequest,
  ListStudentsRequest,
  ListStudentsWithoutClassRequest,
  ListStudentsResponse,
  UpdateStudentRequest,
  DeleteStudentRequest,
  Student,
} from "../../../gen/journal/journal";
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

const client = new StudentServiceClientImpl(rpc);

export async function createStudent(req: CreateStudentRequest): Promise<Student> {
  return client.CreateStudent(req);
}

export async function getStudent(req: GetStudentRequest): Promise<Student> {
  return client.GetStudent(req);
}

export async function listStudents(req: ListStudentsRequest): Promise<ListStudentsResponse> {
  return client.ListStudents(req);
}

export async function listStudentsWithoutClass(
  req: ListStudentsWithoutClassRequest,
): Promise<ListStudentsResponse> {
  return client.ListStudentsWithoutClass(req);
}

export async function updateStudent(req: UpdateStudentRequest): Promise<Student> {
  return client.UpdateStudent(req);
}

export async function deleteStudent(req: DeleteStudentRequest): Promise<Empty> {
  return client.DeleteStudent(req);
}
