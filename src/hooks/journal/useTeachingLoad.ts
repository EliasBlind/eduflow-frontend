import { teachingLoad } from "@/api/client";
import type {
  ListTeachingLoadRequest,
  GetTeachingLoadRequest,
  CreateTeachingLoadRequest,
  UpdateTeachingLoadRequest,
  DeleteTeachingLoadRequest,
} from "@/api/gen/journal/journal";
import { useQuery    } from "./useQuery";
import { useMutation } from "./useMutation";

export function useTeachingLoads(params: ListTeachingLoadRequest = {}) {
  return useQuery(() => teachingLoad.listTeachingLoad(params), { deps: [params] });
}

export function useTeachingLoad(params: GetTeachingLoadRequest) {
  return useQuery(() => teachingLoad.getTeachingLoad(params), {
    skip: params.id == undefined || params.id == null,
    deps: [params.id],
  });
}

export function useCreateTeachingLoad() {
  return useMutation((params: CreateTeachingLoadRequest) => teachingLoad.createTeachingLoad(params));
}

export function useUpdateTeachingLoad() {
  return useMutation((params: UpdateTeachingLoadRequest) => teachingLoad.updateTeachingLoad(params));
}

export function useDeleteTeachingLoad() {
  return useMutation((params: DeleteTeachingLoadRequest) => 
    teachingLoad.deleteTeachingLoad(params).then(() => {}));
}
