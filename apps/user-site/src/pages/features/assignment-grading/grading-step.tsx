import { useState, useEffect } from "react";
import { GradingStatus, FileGradingStatus } from "@/types/grading";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { startGrading, uploadFile } from "@/services/gradingServices";

const statusSteps = [
  GradingStatus.Uploading,
  GradingStatus.Grading,
  GradingStatus.Finished,
];

function getProgress(status: GradingStatus) {
  switch (status) {
    case GradingStatus.Uploading:
      return 33;
    case GradingStatus.Grading:
      return 66;
    case GradingStatus.Finished:
      return 100;
    case GradingStatus.Failed:
      return 100;
    default:
      return 0;
  }
}

// Spinner component
function Spinner() {
  return (
    <span className="inline-block w-3 h-3 mr-1 align-middle">
      <span className="block w-full h-full border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    </span>
  );
}

interface GradingProgressStepProps {
  uploadedFiles: File[];
  attemptId?: string;
}

export default function GradingProgressStep({
  uploadedFiles,
  attemptId,
}: GradingProgressStepProps) {
  const [attempts, setAttempts] = useState<FileGradingStatus[]>(
    uploadedFiles.map((file) => {
      return {
        fileName: file.name,
        status: GradingStatus.Uploading,
      };
    }),
  );

  useEffect(() => {
    if (!attemptId) return;

    const uploadAllFiles = async () => {
      const results = await Promise.all(
        uploadedFiles.map(async (file, index) => {
          let isUploaded = false;

          try {
            isUploaded = await uploadFile(attemptId, file);
          } catch (error) {
            console.log(error);
          }

          return {
            index,
            status: isUploaded ? GradingStatus.Grading : GradingStatus.Failed,
          };
        }),
      );

      const updatedAttempts = [...attempts];
      results.forEach(({ index, status }) => {
        updatedAttempts[index].status = status;
      });
      setAttempts(updatedAttempts);

      // Now call your next function
      // Replace with your actual function
      // await startGrading(attemptId);
    };

    uploadAllFiles();
  }, [attemptId]);

  function getStepStyles(attemptStatus: GradingStatus, step: GradingStatus) {
    const attemptIndex = statusSteps.indexOf(attemptStatus);
    const stepIndex = statusSteps.indexOf(step);
    if (attemptStatus === GradingStatus.Failed && step === GradingStatus.Grading) {
      return {
        dot: "w-2 h-2 rounded-full bg-red-500 inline-block",
        text: "text-red-600",
      };
    }
    if (
      stepIndex < attemptIndex ||
      (attemptStatus === GradingStatus.Finished && stepIndex === statusSteps.length - 1)
    ) {
      return {
        dot: "w-2 h-2 rounded-full bg-green-500 inline-block",
        text: "text-green-600",
      };
    }
    if (stepIndex === attemptIndex) {
      return {
        dot: "w-2 h-2 rounded-full bg-blue-500 inline-block",
        text: "text-blue-600",
      };
    }
    return {
      dot: "w-2 h-2 rounded-full bg-gray-300 inline-block",
      text: "text-gray-400",
    };
  }

  return (
    <div className="w-full">
      <ScrollArea className="h-[650px] pr-2">
        {attempts.map((attempt) => (
          <Card key={attempt.fileName} className="p-0 m-3">
            <CardContent className="py-4">
              <span className="font-medium">{attempt.fileName}</span>
              <div className="mt-2 mb-4 w-full h-2 bg-gray-200 rounded">
                <div
                  className={
                    attempt.status === GradingStatus.Finished
                      ? "bg-green-500 h-2 rounded"
                      : attempt.status === GradingStatus.Failed
                        ? "bg-red-500 h-2 rounded"
                        : "bg-blue-500 h-2 rounded"
                  }
                  style={{ width: `${getProgress(attempt.status)}%` }}
                />
              </div>
              <ul className="flex flex-col gap-1 text-sm">
                {statusSteps.map((step) => {
                  // Determine spinner condition: show spinner only if the attempt is not finished/failed and on the current step
                  const attemptNotComplete =
                    attempt.status !== GradingStatus.Finished &&
                    attempt.status !== GradingStatus.Failed;
                  const isCurrent = attempt.status === step;
                  const { dot, text } = getStepStyles(attempt.status, step);
                  return (
                    <li key={step} className="flex items-center gap-2">
                      {attemptNotComplete && isCurrent ? (
                        <Spinner />
                      ) : (
                        <span className={dot} />
                      )}
                      <span className={text}>{GradingStatus[step]}</span>
                    </li>
                  );
                })}
                {attempt.status === GradingStatus.Failed && (
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                    <span className="text-red-600">Failed</span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        ))}
      </ScrollArea>
    </div>
  );
}
