/**
 * REST-клиент для сервиса StudentService (journal.proto)
 */

import { http } from "../_client";
import type {
  GetStudentRequest,
  CreateStudentRequest,
  ListStudentsRequest,
  ListStudentsResponse,
  UpdateStudentRequest,
  Student,
  DeleteStudentRequest,
} from "../../../gen/journal/journal";

/** POST /v1/students */
export function createStudent(req: CreateStudentRequest): Promise<Student> {
  return http.post("/v1/students", req);
}

/** GET /v1/students/{id} */
export function getStudent(req: GetStudentRequest): Promise<Student> {
  return http.get(`/v1/students/${req.studentId}`);
}

/** GET /v1/students/unassigned */
export function listStudentsWithoutClass(): Promise<ListStudentsResponse> {
  return http.get("/v1/students/unassigned");
}

/** GET /v1/classes/{class_id}/students */
export function listStudents(req: ListStudentsRequest): Promise<ListStudentsResponse> {
  const { classId, limit, offset } = req;
  return http.get(`/v1/classes/${classId}/students`, { limit, offset });
}

/** PUT /v1/students/{id} */
export function updateStudent(req: UpdateStudentRequest): Promise<Student> {
  const { id, ...body } = req;
  return http.put(`/v1/students/${id}`, body);
}

/** DELETE /v1/students/{id} */
export function deleteStudent(req: DeleteStudentRequest): Promise<void> {
  return http.delete(`/v1/students/${req.id}`);
}
