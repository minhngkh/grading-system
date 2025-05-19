import { cn } from "@/lib/utils";
import { SignUp } from "@clerk/clerk-react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div className={cn("flex justify-center", className)} {...props}>
      <SignUp signInUrl="/sign-in" forceRedirectUrl="/" />
    </div>
  );
}
