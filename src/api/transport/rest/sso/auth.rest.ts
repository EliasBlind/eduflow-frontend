import { http } from "../_client";
import type {
  RegisterRequest,
  RegisterResponse,
  VerifyRequest,
  TokenPair,
  LoginRequest,
  LogoutRequest,
  LogoutResponse,
  RefreshRequest,
  ListUsersResponse,
  SetRoleRequest,
  User,
} from "../../../gen/sso/sso";
import type { Empty } from "../../../gen/sso/google/protobuf/empty";

export function register(req: RegisterRequest): Promise<RegisterResponse> {
  return http.post("/v1/auth/register", req);
}

export function verifyEmail(req: VerifyRequest): Promise<TokenPair> {
  return http.post("/v1/auth/verify", req);
}

export function login(req: LoginRequest): Promise<TokenPair> {
  return http.post("/v1/auth/login", req);
}

export function logout(req: LogoutRequest): Promise<LogoutResponse> {
  return http.post("/v1/auth/logout", req);
}

export function refreshToken(req: RefreshRequest): Promise<TokenPair> {
  return http.post("/v1/auth/refresh", req);
}

export function listUsers(): Promise<ListUsersResponse> {
  return http.get("/v1/users");
}

export function setRole(req: SetRoleRequest): Promise<Empty> {
  const { userId, ...body } = req;
  return http.post(`/v1/users/${userId}/role`, body);
}

export function createUsers(req: User[]): Promise<Empty> {
  return http.post("/v1/create_users", { users: req });
}
