import { BlobServiceClient } from "@azure/storage-blob";
import { FileItem } from "@/types/file";

const BLOB_ENDPOINT = "http://127.0.0.1:27000/devstoreaccount1";
//http://127.0.0.1:56774/devstoreaccount1/submissions-store/grading-489a0d9a-adce-08dd-4450-8c914eb8a0c8/duy/main.cpp
const SAS_TOKEN =
  "sv=2023-01-03&ss=btqf&srt=sco&st=2025-06-18T03%3A00%3A03Z&se=2025-06-20T03%3A00%3A00Z&sp=rl&sig=mWuHTs7sXcmRasonPPWb7LJXmS3%2F5bvnY9ETS1ONOi0%3D";
// const SAS_TOKEN = "sv=2023-01-03&ss=btqf&srt=sco&st=2025-06-17T19%3A46%3A22Z&se=2025-06-18T19%3A46%3A22Z&sp=rl&sig=IleZCQAnIcefUvUaNeF4PTDG2rYvm5e9Hz%2BkcPyPmPM%3D"; // Replace with your actual SAS token
const blobServiceClient = new BlobServiceClient(`${BLOB_ENDPOINT}?${SAS_TOKEN}`);
const containerClient = blobServiceClient.getContainerClient("submissions-store");

function inferFileType(name: string): FileItem["type"] {
  if (/\.(jpg|jpeg|png|gif)$/i.test(name)) return "image";
  if (/\.pdf$/i.test(name)) return "pdf";
  if (/\.md$/i.test(name)) return "document";
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
    const type = inferFileType(name);

    let content = "";
    if (type === "code" || type === "document") {
      const blobClient = containerClient.getBlobClient(blob.name);
      const res = await blobClient.download();
      const browserBlob = await res.blobBody;
      content = (await browserBlob?.text()) ?? "";
    }

    items.push({
      id: String(idx++),
      name,
      type,
      content,
      path: name,
      blobPath: blob.name,
    });
  }

  return items;
}
