/**
 * gRPC-клиент для сервиса StudentService (journal.proto)
 */

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

/** Создать студента. `id` и `classId` — опциональны. */
export async function createStudent(req: CreateStudentRequest): Promise<Student> {
  return client.CreateStudent(req);
}

/** Получить студента по UUID. */
export async function getStudent(req: GetStudentRequest): Promise<Student> {
  return client.GetStudent(req);
}

/** Студенты конкретного класса (с пагинацией). */
export async function listStudents(req: ListStudentsRequest): Promise<ListStudentsResponse> {
  return client.ListStudents(req);
}

/** Студенты без назначенного класса. */
export async function listStudentsWithoutClass(
  req: ListStudentsWithoutClassRequest,
): Promise<ListStudentsResponse> {
  return client.ListStudentsWithoutClass(req);
}

/** Обновить данные студента. Все поля кроме `id` — опциональны. */
export async function updateStudent(req: UpdateStudentRequest): Promise<Student> {
  return client.UpdateStudent(req);
}

/** Удалить студента по UUID. */
export async function deleteStudent(req: DeleteStudentRequest): Promise<Empty> {
  return client.DeleteStudent(req);
}
