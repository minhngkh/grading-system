import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
}

export function Spinner({ className }: SpinnerProps) {
  return (
    <span className={cn("w-3 h-3 align-middle", className)}>
      <span
        className={`block w-full h-full border-2 border-gray-400 border-t-transparent rounded-full animate-spin`}
      />
    </span>
  );
}
