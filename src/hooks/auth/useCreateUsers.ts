import { useMutation } from "../journal/useMutation";
import { createUsers } from "@/api/transport/grpc/sso/auth.grpc";
import type { User } from "@/api/gen/sso/sso";

/**
 * Создание пользователей пачкой (только админ).
 * Bearer-токен подставляется транспортным клиентом автоматически.
 */
export function useCreateUsers() {
  return useMutation<Awaited<ReturnType<typeof createUsers>>, User[]>(
    (users) => createUsers(users),
  );
}
