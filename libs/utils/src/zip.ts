import fs from "node:fs";
import path from "node:path";
import AdmZip from "adm-zip";
import { fromThrowable } from "neverthrow";
import { asError, CustomError } from "@/error";
import logger from "@/logger";

class ZipFolderError extends CustomError.withTag("ZipFolderError")<void> {}

export function zipFolderToBuffer(directory: string) {
  const func = fromThrowable(
    () => {
      const zip = new AdmZip();

      const items = fs.readdirSync(directory, { withFileTypes: true });

      for (const item of items) {
        logger.debug(`Adding ${item.name} to zip`);
        const itemPath = path.join(directory, item.name);
        if (item.isDirectory()) {
          zip.addLocalFolder(itemPath, item.name);
        } else {
          zip.addLocalFile(itemPath, "", item.name);
        }
      }

      // zip.writeZip(path.join(process.cwd(), "tmp", "file.zip"));

      return zip.toBuffer();
    },
    (error) =>
      new ZipFolderError({
        message: `Failed to zip folder ${directory}`,
        cause: asError(error),
      }),
  );

  return func();
}
