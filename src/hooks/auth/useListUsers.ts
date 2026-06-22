import { useEffect, useState } from "react";
import { auth } from "@/api/client";
import type { User } from "@/api/gen/sso/sso";

interface UseListUsersReturn {
  users: User[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface State {
  users: User[];
  total: number;
  loading: boolean;
  error: string | null;
}

export function useListUsers(): UseListUsersReturn {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<State>({
    users: [],
    total: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    auth
      .listUsers({})
      .then((res) => {
        if (cancelled) return;
        const list = res?.users ?? [];
        setState({
          users: list,
          total: res?.totalCount ?? list.length,
          loading: false,
          error: null,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : "Не удалось загрузить пользователей",
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [tick]);

  const refetch = () => setTick((t) => t + 1);

  return { ...state, refetch };
}
