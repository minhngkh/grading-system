import { useState, useEffect, useRef } from "react";

/**
 * A hook that returns a debounced value after the specified delay.
 * It calls onChange only after debounce delay (not on initial mount).
 */
export function useDebounceUpdate<T>(
  value: T,
  delay: number,
  onChange?: (value: T) => void,
): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const isFirst = useRef(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);

      if (!isFirst.current) {
        onChange?.(value);
      }
    }, delay);

    isFirst.current = false;

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
