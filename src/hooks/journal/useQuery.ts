import { useEffect, useState } from "react";

interface UseQueryOptions {
  skip?: boolean;
  deps?: unknown[];
}

interface QueryState<TData> {
  data:    TData | null;
  loading: boolean;
  error:   string | null;
}

interface UseQueryReturn<TData> extends QueryState<TData> {
  refetch: () => void;
}

export function useQuery<TData>(
  fetcher: () => Promise<TData>,
  options: UseQueryOptions = {},
): UseQueryReturn<TData> {
  const { skip = false, deps = [] } = options;

  const [tick, setTick] = useState(0);
  const [state, setState] = useState<QueryState<TData>>({
    data:    null,
    loading: !skip,
    error:   null,
  });

  useEffect(() => {
    if (skip) return;

    let cancelled = false;

    fetcher()
      .then((data)  => { if (!cancelled) setState({ data, loading: false, error: null }); })
      .catch((err)  => { if (!cancelled) setState((s) => ({ ...s, loading: false, error: err instanceof Error ? err.message : "Ошибка запроса" })); });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, skip, ...deps]);

  const refetch = () => setTick((t) => t + 1);

  return { ...state, refetch };
}