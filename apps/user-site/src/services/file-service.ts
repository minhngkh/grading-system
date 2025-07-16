import { BlobServiceClient } from "@azure/storage-blob";
import { FileItem } from "@/types/file";
import axios, { AxiosRequestConfig } from "axios";

// Use environment variables instead of hardcoded values
const ASSIGNMENT_FLOW_API_URL = `${import.meta.env.VITE_ASSIGNMENT_FLOW_URL}/api/v1`;
const BLOB_ENDPOINT = import.meta.env.VITE_BLOB_STORAGE_URL;

export class FileService {
  private static async buildHeaders(): Promise<AxiosRequestConfig> {
    return {
      headers: {
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
    };
  }

  static async getSasToken(): Promise<string> {
    try {
      const config = await this.buildHeaders();

      // Match the endpoint format from Scalar
      const url = `${ASSIGNMENT_FLOW_API_URL}/gradings/sasToken`;

      // Use params for attachment instead of adding to URL
      const response = await axios.get(url, {
        ...config,
      });
      // Remove leading question mark if present
      const sasToken = response.data ? response.data.replace(/^\?/, "") : "";
      return sasToken;
    } catch (error) {
      console.error("Error fetching SAS token:", error);
      return "";
    }
  }

  static async loadFileItems(prefix: string): Promise<FileItem[]> {
    try {
      const sasToken = await this.getSasToken();
      const blobServiceClient = new BlobServiceClient(`${BLOB_ENDPOINT}?${sasToken}`);
      const containerClient = blobServiceClient.getContainerClient("submissions-store");

      const dir =
        prefix ?
          prefix.endsWith("/") ?
            prefix
          : prefix + "/"
        : "";

      const items: FileItem[] = [];
      let idx = 1;

      try {
        for await (const blob of containerClient.listBlobsFlat({ prefix: dir })) {
          try {
            const name = blob.name.split("/").pop() || blob.name;
            const extension = this.getExtension(name);
            const type = this.inferFileType(name);
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
          } catch (blobError) {
            console.error(`Error processing blob ${blob.name}:`, blobError);
          }
        }
      } catch (listError) {
        console.error("Error listing blobs:", listError);
        const errorMsg =
          listError && typeof listError === "object" && "message" in listError ?
            (listError as { message: string }).message
          : String(listError);
        throw new Error(`Failed to list files: ${errorMsg}`);
      }

      return items;
    } catch (error) {
      console.error("Error in loadFileItems:", error);
      return [];
    }
  }

  private static getExtension(name: string): string {
    const parts = name.split(".");
    return parts.length > 1 ? parts.pop()?.toLowerCase() || "" : "";
  }

  private static inferFileType(name: string): FileItem["type"] {
    const ext = this.getExtension(name);
    if (["jpg", "jpeg", "png", "gif", "bmp", "webp"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    if (ext === "md") return "document";
    return "code";
  }
}
