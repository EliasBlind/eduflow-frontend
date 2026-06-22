import { useMutation } from "../journal/useMutation";
import { createUsers } from "@/api/transport/grpc/sso/auth.grpc";
import type { User } from "@/api/gen/sso/sso";

export function useCreateUsers() {
  return useMutation<Awaited<ReturnType<typeof createUsers>>, User[]>(
    (users) => createUsers(users),
  );
}
