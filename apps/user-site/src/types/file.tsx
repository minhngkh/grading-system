export type FileItem = {
  id: string;
  name: string;
  extension: string;
  type: "code" | "essay" | "document" | "image" | "pdf";
  content: string;
  path: string;
  relativePath: string;
};
