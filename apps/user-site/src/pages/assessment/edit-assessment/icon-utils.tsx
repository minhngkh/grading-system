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
      return "border-green-100";
    case "info":
      return "border-blue-100";
    case "tip":
      return "border-yellow-100";
    case "caution":
      return "border-red-100";
    default:
      return "border-gray-100";
  }
}

export function getHoverTagColor(tag: string) {
  switch (tag) {
    case "notice":
      return "hover:bg-green-200";
    case "info":
      return "hover:bg-blue-200";
    case "tip":
      return "hover:bg-yellow-200";
    case "caution":
      return "hover:bg-red-200";
    default:
      return "hover:bg-gray-200";
  }
}

export function getActiveTagColor(tag: string) {
  switch (tag) {
    case "notice":
      return "bg-green-300";
    case "info":
      return "bg-blue-300";
    case "tip":
      return "bg-yellow-300";
    case "caution":
      return "bg-red-300";
    default:
      return "bg-gray-300";
  }
}
