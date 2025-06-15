import { Button } from "@/components/ui/button";
import { useRouter } from "@tanstack/react-router";

export default function ErrorComponent(message?: string) {
  const router = useRouter();
  const handleRetry = () => {
    router.invalidate();
  };

  return (
    <div className="container flex flex-col size-full justify-center items-center gap-4">
      <p>{`${message ? message : "Service not available"}. Please try again later!`}</p>
      <Button onClick={handleRetry}>Retry</Button>
    </div>
  );
}
