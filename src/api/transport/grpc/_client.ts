import { grpc } from "@improbable-eng/grpc-web";
import { GrpcWebImpl } from "../../gen/sso/sso";
import { useAuthStore } from "@/storage/auth.store";

const BASE_URL = import.meta.env.VITE_GRPC_BASE_URL ?? "http://localhost:8080";

class AuthedGrpcWebImpl extends GrpcWebImpl {
  unary<T extends grpc.UnaryMethodDefinition<any, any>>(
    methodDesc: T,
    request: any,
    metadata: grpc.Metadata | undefined,
  ): Promise<any> {
    const token = useAuthStore.getState().accessToken;
    const meta = metadata ?? new grpc.Metadata();
    if (token) meta.set("Authorization", `Bearer ${token}`);
    return super.unary(methodDesc, request, meta);
  }
}

export const rpc = new AuthedGrpcWebImpl(BASE_URL, {
  debug: import.meta.env.DEV,
});