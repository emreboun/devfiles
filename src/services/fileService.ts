import { FileOperation } from "../types";
import { executeFileOperation } from "../utils/fileUtils";

export class FileService {
  async processFileOperation(operation: FileOperation): Promise<string | void> {
    return executeFileOperation(operation);
  }

  async readFile(path: string): Promise<string> {
    const result = await executeFileOperation({ type: "read", path });
    if (typeof result !== "string") {
      throw new Error("Expected string result from read operation");
    }
    return result;
  }

  async writeFile(path: string, content: string): Promise<void> {
    const result = await executeFileOperation({ type: "write", path, content });
    if (result !== undefined) {
      throw new Error("Expected void result from write operation");
    }
  }

  async deleteFile(path: string): Promise<void> {
    const result = await executeFileOperation({ type: "delete", path });
    if (result !== undefined) {
      throw new Error("Expected void result from delete operation");
    }
  }

  async moveFile(sourcePath: string, targetPath: string): Promise<void> {
    const result = await executeFileOperation({
      type: "move",
      path: sourcePath,
      content: targetPath,
    });
    if (result !== undefined) {
      throw new Error("Expected void result from move operation");
    }
  }
}
