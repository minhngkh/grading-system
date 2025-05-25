import { cn } from "@/lib/utils";

interface SpinnerProps {
  className?: string;
  color?: string;
}

export default function Spinner({ className = "", color = "blue-400" }: SpinnerProps) {
  return (
    <span className={cn("w-3 h-3 mr-1 align-middle", className)}>
      <span
        className={`block w-full h-full border-2 border-${color} border-t-transparent rounded-full animate-spin`}
      />
    </span>
  );
}
