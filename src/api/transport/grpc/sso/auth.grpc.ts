import { rpc } from "../_client";
import { AuthClientImpl } from "../../../gen/sso/sso";
import {
  type RegisterRequest,
  type RegisterResponse,
  type VerifyRequest,
  type TokenPair,
  type LoginRequest,
  type LogoutRequest,
  type LogoutResponse,
  type RefreshRequest,
  type ListUsersRequest,
  type ListUsersResponse,
  type SetRoleRequest,
  type User,
} from "../../../gen/sso/sso";
import type { Empty } from "../../../gen/sso/google/protobuf/empty";

const client = new AuthClientImpl(rpc);

export async function register(req: RegisterRequest): Promise<RegisterResponse> {
  return client.Register(req);
}

export async function verifyEmail(req: VerifyRequest): Promise<TokenPair> {
  return client.VerifyEmail(req);
}

export async function login(req: LoginRequest): Promise<TokenPair> {
  return client.Login(req);
}

export async function logout(req: LogoutRequest): Promise<LogoutResponse> {
  return client.Logout(req);
}

export async function refreshToken(req: RefreshRequest): Promise<TokenPair> {
  return client.RefreshToken(req);
}

export async function listUsers(req: ListUsersRequest): Promise<ListUsersResponse> {
  return client.ListUsers(req);
}

export async function setRole(req: SetRoleRequest): Promise<Empty> {
  return client.SetRole(req);
}

export async function createUsers(req: User[]): Promise<Empty> {
  return client.CreateUsers({users: req});
}
