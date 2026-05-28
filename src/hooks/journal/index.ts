// Базовые примитивы (переиспользуются в domain-хуках)
export { useQuery    } from "./useQuery";
export { useMutation } from "./useMutation";

// Domain-хуки
export {
  useStudents,
  useStudent,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
} from "./useStudents";

export {
  useTeachers,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
} from "./useTeachers";

export {
  useClasses,
  useClass,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
} from "./useClasses";

export {
  useSubjects,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
} from "./useSubjects";

export {
  useGrades,
  useRecordGrade,
  useUpdateGrade,
  useDeleteGrade,
} from "./useGrades";

export {
  useHomeworkList,
  useRecordHomework,
  useUpdateHomework,
  useDeleteHomework,
} from "./useHomework";

export {
  useStatusCodes,
  useCreateStatusCode,
  useUpdateStatusCode,
  useDeleteStatusCode,
} from "./useStatusCodes";

export {
  useTeachingLoads,
  useTeachingLoad,
  useCreateTeachingLoad,
  useUpdateTeachingLoad,
  useDeleteTeachingLoad,
} from "./useTeachingLoad";
