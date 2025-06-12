import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSubmissionName } from "@/lib/submission";
import { GradingAttempt, Submission } from "@/types/grading";
import { FileArchive, FolderOpen, Trash2 } from "lucide-react";

interface FileListProps {
  gradingAttempt: GradingAttempt;
  onDelete?: (submission: Submission) => Promise<void>;
}

export function FileList({ gradingAttempt, onDelete }: FileListProps) {
  return (
    <Card className="w-full py-0 max-h-[400px] overflow-hidden">
      <CardContent className="p-0 overflow-y-auto max-h-[400px]">
        <div className="divide-y">
          {gradingAttempt.submissions?.map((submission, index) => (
            <FileComponent
              key={index}
              submission={submission}
              index={index}
              onDelete={onDelete}
            />
          ))}
        </div>
        {gradingAttempt.submissions?.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[200px] p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
              <FolderOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              No files have been uploaded yet. Upload some files to get started.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FileComponentProps {
  submission: Submission;
  index: number;
  onDelete?: (submission: Submission) => void;
}

function FileComponent({ submission, onDelete, index }: FileComponentProps) {
  return (
    <div
      key={index}
      className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center space-x-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-background">
          <FileArchive className="h-5 w-5 text-purple-500" />
        </div>
        <span className="font-medium">{getSubmissionName(submission)}</span>
      </div>
      <div className="flex items-center space-x-3">
        <Badge>Archive</Badge>
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(submission)}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        )}
      </div>
    </div>
  );
}
