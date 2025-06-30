import { RubricView } from "@/components/app/rubric-view";
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
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";

type RubricDialogProps = {
  rubricId?: string;
  initialRubric?: Rubric;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function ViewRubricDialog({
  rubricId,
  initialRubric,
  open,
  onOpenChange,
}: RubricDialogProps) {
  const [rubric, setRubric] = useState<Rubric | undefined>(initialRubric);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const auth = useAuth();

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (open) {
      setError("");
      if (initialRubric) {
        setRubric(initialRubric);
      } else {
        setRubric(undefined);
      }
    } else {
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

  const fetchRubric = useCallback(async () => {
    if (!rubricId) return;

    try {
      setIsLoading(true);
      setError("");

      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const token = await auth.getToken();
      if (!token) {
        throw new Error("Unauthorized: No token found");
      }

      const fetchedRubric = await RubricService.getRubric(rubricId, token);

      if (!abortControllerRef.current.signal.aborted) {
        setRubric(fetchedRubric);
      }
    } catch (error) {
      if (!abortControllerRef.current?.signal.aborted) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load rubric";
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  }, [rubricId]);

  useEffect(() => {
    if (open && !rubric && rubricId) {
      fetchRubric();
    }
  }, [open, rubric, rubricId, fetchRubric]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      onOpenChange?.(open);
    },
    [onOpenChange],
  );

  const handleRetry = useCallback(() => {
    fetchRubric();
  }, [fetchRubric]);

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
        <div className="w-full h-[60vh] overflow-y-auto flex flex-col">
          <RubricView rubricData={rubric} />
        </div>
      );
    }

    return null;
  }, [validationState, error, rubric, rubricId, handleRetry]);

  const getDialogTitle = () => {
    if (validationState.showLoading) return "Loading Rubric";
    if (validationState.showError) return "Error Loading Rubric";
    if (validationState.showNoRubric) return "Rubric Not Found";
    if (rubric) return rubric.name;
    return "View Rubric";
  };

  const getDialogDescription = () => {
    if (validationState.showLoading)
      return "Please wait while we load the rubric details.";
    if (validationState.showError) return "There was an error loading the rubric.";
    if (validationState.showNoRubric) return "The requested rubric could not be found.";
    if (rubric)
      return "Review the criteria, levels, and scoring details for this rubric.";
    return "Rubric details will be displayed here.";
  };

  if (!validationState.hasRubricId && !validationState.hasInitialRubric) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="min-w-[80%] max-w-[95%] max-h-[90vh] flex flex-col"
      >
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-2">
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>{getDialogDescription()}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden mt-4">{renderContent}</div>

        <div className="border-t pt-4 text-xs text-muted-foreground text-center">
          Tip: Press Escape to close{error && ", Ctrl+R to retry"}
        </div>
      </DialogContent>
    </Dialog>
  );
}
