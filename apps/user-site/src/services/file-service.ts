import { FileItem } from "@/types/file";

// Xác định loại file dựa vào đuôi file
const BLOB_URL = "http://127.0.0.1:27000";
function inferFileType(fileName: string): FileItem["type"] {
  if (/\.(jpg|jpeg|png|gif)$/i.test(fileName)) return "image";
  if (/\.pdf$/i.test(fileName)) return "pdf";
  if (/\.md$/i.test(fileName)) return "document";
  if (/\.txt|\.cpp|\.py|\.js|\.ts|\.java|\.c|\.h$/i.test(fileName)) return "code";
  return "code";
}

// Parse XML để lấy danh sách blob từ Azure Storage
export async function fetchBlobNames(prefix: string): Promise<string[]> {
  try {
    const urlPrefix = prefix.includes("_") ? prefix.split("_")[0] + "/" : prefix + "/";
    const res = await fetch(
      `${BLOB_URL}/devstoreaccount1/submissions-store?restype=container&comp=list&prefix=${urlPrefix}`,
    );
    const text = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "application/xml");
    const blobs = Array.from(xmlDoc.getElementsByTagName("Blob"))
      .map((blob) => blob.getElementsByTagName("Name")[0]?.textContent || "")
      .filter(Boolean);
    return blobs;
  } catch (error) {
    console.error("Lỗi khi fetch blob list:", error);
    return [];
  }
}

// Tải nội dung file nếu là code hoặc document
async function fetchFileContent(
  blobPath: string,
  type: FileItem["type"],
): Promise<string> {
  if (type === "code" || type === "document") {
    try {
      const url = `${BLOB_URL}/devstoreaccount1/submissions-store/${blobPath}`;
      const res = await fetch(url);
      return await res.text();
    } catch {
      return "// Cannot load file content";
    }
  }
  return "";
}

// Build list FileItem từ blob paths
export async function buildFileItems(blobPaths: string[]): Promise<FileItem[]> {
  return Promise.all(
    blobPaths.map(async (blob, idx) => {
      const name = blob.split("/").pop() || blob;
      const type = inferFileType(name);
      const content = await fetchFileContent(blob, type);
      return {
        id: String(idx + 1),
        name,
        type,
        content,
        path: name,
        blobPath: blob,
      };
    }),
  );
}
