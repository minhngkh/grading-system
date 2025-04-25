import JSZip from "jszip";

export type ZipNode = {
  name: string;
  type: "file" | "folder";
  children?: ZipNode[];
};

export async function parseZipToTree(file: File): Promise<ZipNode> {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(file);

  const root: any = {
    name: "root",
    type: "folder",
    children: {},
  };

  const ensurePath = (parts: string[], parent: any, isDir: boolean) => {
    const [head, ...rest] = parts;
    if (!head) return;

    const isLast = rest.length === 0;

    if (!parent.children[head]) {
      parent.children[head] = {
        name: head,
        type: isLast ? (isDir ? "folder" : "file") : "folder",
        ...(isLast && isDir ? { children: {} } : {}),
        ...(rest.length > 0 ? { children: {} } : {}),
      };
    }

    if (rest.length > 0) {
      ensurePath(rest, parent.children[head], isDir);
    }
  };

  zipContent.forEach((relativePath, entry) => {
    const parts = relativePath.split("/").filter(Boolean);
    if (parts.length === 0) return;

    ensurePath(parts, root, entry.dir);
  });

  const toArray = (node: any): ZipNode => ({
    name: node.name,
    type: node.type,
    ...(node.type === "folder"
      ? { children: Object.values(node.children).map(toArray) }
      : {}),
  });

  return toArray(root);
}
