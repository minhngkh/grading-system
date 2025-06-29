import { BlobServiceClient } from "@azure/storage-blob";
import { FileItem } from "@/types/file";

const BLOB_ENDPOINT = "http://127.0.0.1:27000/devstoreaccount1";

const SAS_TOKEN =
  "sv=2023-01-03&ss=btqf&srt=sco&st=2025-06-29T13%3A58%3A28Z&se=2025-10-08T13%3A58%3A00Z&sp=rl&sig=4FFusSSBp5eqWoZ2ahgafhFCUQfJW5mbkNXhIE4U6RY%3D";

const blobServiceClient = new BlobServiceClient(`${BLOB_ENDPOINT}?${SAS_TOKEN}`);
const containerClient = blobServiceClient.getContainerClient("submissions-store");

function getExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
}

function inferFileType(name: string): FileItem["type"] {
  const ext = getExtension(name);
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (ext === "md") return "document";
  if (ext === "txt") return "essay";
  return "code";
}

// Hàm duy nhất trả về FileItem[]
export async function loadFileItems(prefix: string): Promise<FileItem[]> {
  const dir =
    prefix ?
      prefix.endsWith("/") ?
        prefix
      : prefix + "/"
    : "";

  const items: FileItem[] = [];
  let idx = 1;

  for await (const blob of containerClient.listBlobsFlat({ prefix: dir })) {
    const name = blob.name.split("/").pop() || blob.name;
    const extension = getExtension(name);
    const type = inferFileType(name);
    let content = "";
    if (type === "code" || type === "document" || type === "essay") {
      const blobClient = containerClient.getBlobClient(blob.name);
      const res = await blobClient.download();
      const browserBlob = await res.blobBody;
      content = (await browserBlob?.text()) ?? "";
    } else if (type === "image" || type === "pdf") {
      const blobClient = containerClient.getBlobClient(blob.name);
      const res = await blobClient.download();
      const browserBlob = await res.blobBody;
      if (!browserBlob) throw new Error("Failed to download blob");
      content = URL.createObjectURL(browserBlob);
    }
    let relativePath = blob.name;
    if (dir && blob.name.startsWith(dir)) {
      relativePath = blob.name.substring(dir.length);
    }
    items.push({
      id: String(idx++),
      name,
      extension,
      type,
      content,
      path: name,
      relativePath,
    });
  }

  return items;
}
