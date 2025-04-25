import { SignIn } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn("flex justify-center min-h-screen", className)}
      {...props}
    >
      <SignIn signUpUrl="/signup" forceRedirectUrl="/" />
    </div>
  );
}
