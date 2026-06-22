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
import type { Empty } from "../../../gen/journal/google/protobuf/empty";

export function createStudent(req: CreateStudentRequest): Promise<Student> {
  return http.post("/v1/students", req);
}

export function getStudent(req: GetStudentRequest): Promise<Student> {
  return http.get(`/v1/students/${req.studentId}`);
}

export function listStudentsWithoutClass(): Promise<ListStudentsResponse> {
  return http.get("/v1/students/unassigned");
}


export function listStudents(req: ListStudentsRequest): Promise<ListStudentsResponse> {
  const { classId, limit, offset } = req;
  return http.get(`/v1/classes/${classId}/students`, { limit, offset });
}

export function updateStudent(req: UpdateStudentRequest): Promise<Student> {
  const { id, ...body } = req;
  return http.put(`/v1/students/${id}`, body);
}

export function deleteStudent(req: DeleteStudentRequest): Promise<Empty> {
  return http.delete(`/v1/students/${req.id}`);
}
