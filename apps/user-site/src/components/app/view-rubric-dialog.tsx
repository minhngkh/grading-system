import RubricView from "@/components/app/rubric-view";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RubricService } from "@/services/rubric-service";
import { Rubric } from "@/types/rubric";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { AlertCircle, RefreshCw, Loader2, Eye } from "lucide-react";
import { toast } from "sonner";

type RubricDialogProps = {
  rubricId?: string;
  initialRubric?: Rubric;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onRubricLoad?: (rubric: Rubric) => void;
};

export const ViewRubricDialog = ({
  rubricId,
  initialRubric,
  open,
  onOpenChange,
  onRubricLoad,
}: RubricDialogProps) => {
  const [rubric, setRubric] = useState<Rubric | undefined>(initialRubric);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Reset state when dialog opens/closes or when rubricId/initialRubric changes
  useEffect(() => {
    if (open) {
      setError("");
      if (initialRubric) {
        setRubric(initialRubric);
      } else {
        setRubric(undefined);
      }
    } else {
      // Cancel any ongoing requests when dialog closes
      abortControllerRef.current?.abort();
    }
  }, [open, initialRubric]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange?.(false);
      } else if (e.key === "r" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (error) {
          handleRetry();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, error]);

  // Memoized fetch function to prevent recreation on every render
  const fetchRubric = useCallback(async () => {
    if (!rubricId) return;

    try {
      setIsLoading(true);
      setError("");

      // Cancel previous request if still pending
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const fetchedRubric = await RubricService.getRubric(rubricId);

      // Check if component is still mounted and request wasn't aborted
      if (!abortControllerRef.current.signal.aborted) {
        setRubric(fetchedRubric);
        onRubricLoad?.(fetchedRubric);

        toast.success("Rubric loaded successfully", {
          description: `Loaded "${fetchedRubric.rubricName}"`,
        });
      }
    } catch (error) {
      // Only handle error if component is still mounted and not aborted
      if (!abortControllerRef.current?.signal.aborted) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load rubric";
        setError(errorMessage);
        console.error("Error fetching rubric:", error);

        toast.error("Failed to load rubric", {
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [rubricId, onRubricLoad]);

  // Fetch rubric when needed
  useEffect(() => {
    if (open && !rubric && rubricId) {
      fetchRubric();
    }
  }, [open, rubric, rubricId, fetchRubric]);

  // Memoized handlers
  const handleOpenChange = useCallback(
    (open: boolean) => {
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  const handleRetry = useCallback(() => {
    fetchRubric();
  }, [fetchRubric]);

  // Memoized validation state
  const validationState = useMemo(() => {
    const hasRubricId = Boolean(rubricId);
    const hasInitialRubric = Boolean(initialRubric);
    const hasRubric = Boolean(rubric);
    const showError = Boolean(error && !isLoading);
    const showLoading = isLoading;
    const showNoRubric = !hasRubric && !showLoading && !showError && hasRubricId;

    return {
      hasRubricId,
      hasInitialRubric,
      hasRubric,
      showError,
      showLoading,
      showNoRubric,
    };
  }, [rubricId, initialRubric, rubric, error, isLoading]);

  // Memoized content rendering
  const renderContent = useMemo(() => {
    if (validationState.showLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <div className="text-muted-foreground">Loading rubric...</div>
          <div className="text-sm text-muted-foreground">
            Please wait while we fetch the rubric details
          </div>
        </div>
      );
    }

    if (validationState.showError) {
      return (
        <Alert variant="destructive" className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={handleRetry} className="h-8">
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      );
    }

    if (validationState.showNoRubric) {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <div className="text-muted-foreground">No rubric found</div>
          <div className="text-sm text-muted-foreground text-center">
            The requested rubric could not be found or may have been deleted.
          </div>
          {rubricId && (
            <Button variant="outline" size="sm" onClick={handleRetry} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
        </div>
      );
    }

    if (validationState.hasRubric && rubric) {
      return (
        <>
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {rubric.rubricName}
            </DialogTitle>
            <DialogDescription>
              Review the criteria, levels, and scoring details for this rubric.
            </DialogDescription>
          </DialogHeader>
          <div className="w-full h-[60vh] overflow-y-auto flex flex-col mt-4">
            <RubricView rubricData={rubric} showPlugins />
          </div>
        </>
      );
    }

    return null;
  }, [validationState, error, rubric, rubricId, handleRetry]);

  // Don't render if no rubric source is provided
  if (!validationState.hasRubricId && !validationState.hasInitialRubric) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="min-w-[80%] max-w-[95%] max-h-[90vh] flex flex-col"
      >
        <DialogHeader>
          <DialogTitle>View Rubric</DialogTitle>
          <DialogDescription>
            {validationState.hasRubric ?
              "Review the details of the selected rubric."
            : "Loading rubric details..."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">{renderContent}</div>

        {/* Footer with keyboard shortcuts hint */}
        <div className="border-t pt-4 text-xs text-muted-foreground text-center">
          Tip: Press Escape to close{error && ", Ctrl+R to retry"}
        </div>
      </DialogContent>
    </Dialog>
  );
};
