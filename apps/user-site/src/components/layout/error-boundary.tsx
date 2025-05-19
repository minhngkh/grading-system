import { Button } from "@/components/ui/button";

export function ErrorBoundary({ error }: { error: Error }) {
  // This is a simple error boundary that catches errors in the app and displays a message.
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Oops! Something went wrong</h1>
      <p className="text-muted-foreground">
        {error instanceof Error ? error.message : "Unknown error occurred"}
      </p>
      <Button onClick={() => window.location.reload()}>Try Again</Button>
    </div>
  );
}
