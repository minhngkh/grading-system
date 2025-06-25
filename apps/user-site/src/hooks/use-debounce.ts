import { useState, useEffect, useRef } from "react";

/**
 * A hook that returns a debounced value after the specified delay
 * It avoids updating the debounced value if the incoming value is equal.
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const previousValueRef = useRef(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Only update if value changed (by shallow reference)
      if (previousValueRef.current !== value) {
        previousValueRef.current = value;
        setDebouncedValue(value);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
