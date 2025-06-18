import { FileText, Code, CheckCircle, PlayCircle, XCircle, Clock } from "lucide-react";

export function getFileIcon(file: { type: string; name: string }) {
  switch (file.type) {
    case "code":
      return <Code className="h-4 w-4 text-blue-500" />;
    case "document":
      if (file.name.endsWith(".md"))
        return <FileText className="h-4 w-4 text-green-500" />;
      return <FileText className="h-4 w-4 text-gray-500" />;
    default:
      return <FileText className="h-4 w-4 text-gray-500" />;
  }
}

export function getTestStatusIcon(status: string) {
  switch (status) {
    case "passed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    default:
      return <PlayCircle className="h-4 w-4 text-gray-500" />;
  }
}

export function getTagColor(tag: string) {
  switch (tag) {
    case "notice":
      return "bg-green-100 text-green-800 border-green-200";
    case "info":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "tip":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "caution":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}
