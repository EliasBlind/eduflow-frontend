import { grpc } from "@improbable-eng/grpc-web";
import { GrpcWebImpl } from "@/api/gen/sso/sso";
import { useAuthStore } from "@/storage/auth.store";

const BASE_URL = import.meta.env.VITE_GRPC_BASE_URL ?? "http://localhost:8080";

const NO_AUTH_METHODS = new Set(["RefreshToken"]);

class AuthedGrpcWebImpl extends GrpcWebImpl {
  unary<TReq extends grpc.ProtobufMessage, TRes extends grpc.ProtobufMessage>(
    methodDesc: grpc.UnaryMethodDefinition<TReq, TRes>,
    request: TReq,
    metadata: grpc.Metadata | undefined,
  ): Promise<TRes> {
    const meta = metadata ?? new grpc.Metadata();

    if (!NO_AUTH_METHODS.has(methodDesc.methodName)) {
      const token = useAuthStore.getState().accessToken;
      if (token) meta.set("Authorization", `Bearer ${token}`);
    }

    return super.unary(methodDesc, request, meta);
  }
}

export const rpc = new AuthedGrpcWebImpl(BASE_URL, {
  debug: import.meta.env.DEV,
});
