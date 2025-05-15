import { useEffect, useRef } from "react";

interface UsePollingOptions {
  interval: number;
  enabled?: boolean;
  onError?: (error: Error) => void;
}

export function usePolling<T>(
  pollingFn: () => Promise<T>,
  onSuccess: (data: T) => void,
  options: UsePollingOptions,
) {
  const { interval, enabled = true, onError } = options;
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);

  useEffect(() => {
    if (!enabled) return;

    const poll = async () => {
      try {
        const result = await pollingFn();
        onSuccess(result);
      } catch (error) {
        onError?.(error as Error);
      } finally {
        timeoutRef.current = setTimeout(poll, interval);
      }
    };

    // Start polling immediately
    poll();

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [pollingFn, onSuccess, interval, enabled, onError]);

  return {
    stop: () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
  };
}
