import { cn } from "@/lib/utils";
import { SignIn } from "@clerk/clerk-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("flex justify-center", className)} {...props}>
      <SignIn signUpUrl="/signup" forceRedirectUrl="/" />
    </div>
  );
}
