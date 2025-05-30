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
  const { interval, onError, enabled } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    stoppedRef.current = false;

    const poll = async () => {
      try {
        const result = await pollingFn();
        onSuccess(result);
      } catch (error) {
        onError?.(error as Error);
        return;
      }

      if (!stoppedRef.current) {
        timeoutRef.current = setTimeout(poll, interval);
      }
    };

    // Start polling *after* interval delay instead of immediately:
    poll();

    return () => {
      stoppedRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled]);

  return {
    stop: () => {
      stoppedRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
  };
}
