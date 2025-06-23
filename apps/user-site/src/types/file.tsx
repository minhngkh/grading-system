export type FileItem = {
  id: string;
  name: string;
  type: "code" | "document" | "image" | "pdf";
  content: string;
  path: string;
  blobPath: string;
};
