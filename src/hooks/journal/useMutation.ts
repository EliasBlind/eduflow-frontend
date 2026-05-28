import { useCallback, useState } from "react";

interface UseMutationReturn<TData, TParams> {
  mutate:  (params: TParams) => Promise<TData>;
  loading: boolean;
  error:   string | null;
  reset:   () => void;
}

/**
 * Базовый хук для мутаций (create / update / delete).
 * @param mutationFn  Функция, выполняющая запрос
 *
 * @example
 * const { mutate } = useMutation(students.createStudent);
 * await mutate({ name: "Иван" });
 */
export function useMutation<TData, TParams>(
  mutationFn: (params: TParams) => Promise<TData>,
): UseMutationReturn<TData, TParams> {
  const [loading, setLoading] = useState(false);
  const [error,   setError  ] = useState<string | null>(null);

  const mutate = useCallback(async (params: TParams): Promise<TData> => {
    setLoading(true);
    setError(null);

    try {
      return await mutationFn(params);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ошибка запроса";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [mutationFn]);

  const reset = useCallback(() => {
    setError(null);
  }, []);

  return { mutate, loading, error, reset };
}
