import { classes } from "@/api/client";
import type {
  ListClassesRequest,
  GetClassRequest,
  CreateClassRequest,
  UpdateClassRequest,
  DeleteClassRequest,
} from "@/api/gen/journal/journal";
import { useQuery    } from "./useQuery";
import { useMutation } from "./useMutation";

export function useClasses(params: ListClassesRequest = {}) {
  return useQuery(() => classes.listClasses(params), { deps: [params] });
}

export function useClass(params: GetClassRequest) {
  return useQuery(() => classes.getClass(params), {
    skip: !params.id,
    deps: [params.id],
  });
}

export function useCreateClass() {
  return useMutation((params: CreateClassRequest) => classes.createClass(params));
}

export function useUpdateClass() {
  return useMutation((params: UpdateClassRequest) => classes.updateClass(params));
}

export function useDeleteClass() {
  return useMutation((params: DeleteClassRequest) =>
    classes.deleteClass(params).then(() => {})
  );
}