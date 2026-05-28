import { statusCodes } from "@/api/client";
import type {
  CreateStatusCodeRequest,
  UpdateStatusCodeRequest,
  DeleteStatusCodeRequest,
} from "@/api/gen/journal/journal";
import { useQuery    } from "./useQuery";
import { useMutation } from "./useMutation";

export function useStatusCodes() {
  return useQuery(() => statusCodes.listStatusCode({}));
}

export function useCreateStatusCode() {
  return useMutation((params: CreateStatusCodeRequest) => statusCodes.createStatusCode(params));
}

export function useUpdateStatusCode() {
  return useMutation((params: UpdateStatusCodeRequest) => statusCodes.updateStatusCode(params));
}

export function useDeleteStatusCode() {
  return useMutation((params: DeleteStatusCodeRequest) => statusCodes.deleteStatusCode(params).then(() => {}));
}
