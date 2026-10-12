import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../api/client';

/**
 * Runs an async function whenever `deps` change and exposes { data, loading, error, reload }.
 * Older, slower responses are ignored so the UI never shows stale data.
 */
export function useAsync(fn, deps) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const run = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      if (id === requestId.current) setData(result);
    } catch (e) {
      if (id === requestId.current) setError(getErrorMessage(e));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return { data, loading, error, reload: run };
}
