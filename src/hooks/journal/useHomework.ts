import { homework } from "@/api/client";
import type {
  ListHomeworkRequest,
  RecordHomeworkRequest,
  UpdateHomeworkRequest,
  DeleteHomeworkRequest,
} from "@/api/gen/journal/journal";
import { useQuery    } from "./useQuery";
import { useMutation } from "./useMutation";

export function useHomeworkList(params: ListHomeworkRequest) {
  return useQuery(
    () => homework.listHomework(params),
    { deps: [params.classId, params.subjectId, params.start, params.end] },
  );
}

export function useRecordHomework() {
  return useMutation((params: RecordHomeworkRequest) => homework.recordHomework(params));
}

export function useUpdateHomework() {
  return useMutation((params: UpdateHomeworkRequest) => homework.updateHomework(params));
}

export function useDeleteHomework() {
  return useMutation((params: DeleteHomeworkRequest) => homework.deleteHomework(params).then(() => {}));
}
