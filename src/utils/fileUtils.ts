import { promises as fs } from "fs";
import path from "path";
import { FileOperation } from "../types";

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf-8");
}

export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  return fs.writeFile(filePath, content, "utf-8");
}

export async function deleteFile(filePath: string): Promise<void> {
  return fs.unlink(filePath);
}

export async function moveFile(
  sourcePath: string,
  targetPath: string
): Promise<void> {
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  return fs.rename(sourcePath, targetPath);
}

export async function executeFileOperation(
  operation: FileOperation
): Promise<string | void> {
  switch (operation.type) {
    case "read":
      return readFile(operation.path);
    case "write":
      if (!operation.content)
        throw new Error("Content is required for write operations");
      return writeFile(operation.path, operation.content);
    case "delete":
      return deleteFile(operation.path);
    case "move":
      if (!operation.content)
        throw new Error("Target path is required for move operations");
      return moveFile(operation.path, operation.content);
    default:
      throw new Error(`Unsupported operation type: ${operation.type}`);
  }
}
