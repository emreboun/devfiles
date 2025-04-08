// src/models/Project.ts
import { File, Directory } from "./FileSystem";
import { TypeScriptAnalyzer } from "../analyzers/TypescriptAnalyzer";
import { UpdateOperation, UpdateResult, ProjectStats } from "../types/updates";
import { Subject } from "rxjs";
import { FileSystemService } from "../services/FileSystemService";

export interface ProjectData {
  id: string;
  name: string;
  rootPath: string;
  language: string;
  lastUpdated: Date;
  metadata: {
    description?: string;
    tags?: string[];
    dependencies?: Record<string, string>;
  };
}

export interface ProjectCreateInput {
  name: string;
  rootPath: string;
  language?: string;
  metadata?: {
    description?: string;
    tags?: string[];
    dependencies?: Record<string, string>;
  };
}

export class Project {
  public root: Directory;
  public pendingUpdates: UpdateOperation[] = [];
  private analyzer: TypeScriptAnalyzer;
  public events = new Subject<{
    change?: { path: string; content?: string };
    commit?: UpdateResult;
  }>();

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly path: string,
    public readonly language: string = "typescript",
    public readonly metadata: Record<string, any> = {},
    private readonly fileService: FileSystemService
  ) {
    this.analyzer = new TypeScriptAnalyzer();
    this.root = new Directory("", null);
  }

  async load(): Promise<void> {
    const files = await this.fileService.readProjectFiles(this.path);
    this.root = this.buildFileTree(files);

    // Parse TypeScript files to build AST model
    await this.analyzer.analyzeProject(this.root);
  }

  private buildFileTree(files: { path: string; content: string }[]): Directory {
    const root = new Directory("", null);

    for (const file of files) {
      const parts = file.path.split("/");
      const fileName = parts.pop() || "";
      let currentDir = root;

      // Create directory structure
      for (const part of parts) {
        let dir = currentDir.getChild(part) as Directory;
        if (!dir) {
          dir = new Directory(part, currentDir);
          currentDir.addChild(dir);
        }
        currentDir = dir;
      }

      // Create file
      const newFile = new File(fileName, currentDir, file.content);
      currentDir.addChild(newFile);
    }

    return root;
  }

  // Get file content from the in-memory model
  getFile(path: string): File | null {
    return this.root.findFile(path);
  }

  // Update a file in the in-memory model
  updateFile(path: string, content: string, metadata?: any): void {
    const file = this.getFile(path);
    if (file) {
      file.setContent(content);
      this.pendingUpdates.push({
        type: "update",
        path,
        content,
        metadata,
      });
    } else {
      this.createFile(path, content, metadata);
    }

    // If it's a TypeScript file, update the analyzer model
    if (path.endsWith(".ts") || path.endsWith(".tsx")) {
      this.analyzer.updateFile(path, content);
    }

    this.events.next({ change: { path, content } });
  }

  // Create a new file in the in-memory model
  createFile(path: string, content: string, metadata?: any): void {
    const dirPath = path.substring(0, path.lastIndexOf("/"));
    const fileName = path.substring(path.lastIndexOf("/") + 1);

    let dir = this.ensureDirectoryExists(dirPath);
    const newFile = new File(fileName, dir, content);
    dir.addChild(newFile);

    this.pendingUpdates.push({
      type: "create",
      path,
      content,
      metadata,
    });

    // If it's a TypeScript file, update the analyzer model
    if (path.endsWith(".ts") || path.endsWith(".tsx")) {
      this.analyzer.addFile(path, content);
    }

    this.events.next({ change: { path, content } });
  }

  // Delete a file in the in-memory model
  deleteFile(path: string): void {
    const file = this.getFile(path);
    if (file && file.parent) {
      file.parent.removeChild(file.name);
      this.pendingUpdates.push({
        type: "delete",
        path,
      });

      // If it's a TypeScript file, update the analyzer model
      if (path.endsWith(".ts") || path.endsWith(".tsx")) {
        this.analyzer.removeFile(path);
      }

      this.events.next({ change: { path } });
    }
  }

  private ensureDirectoryExists(dirPath: string): Directory {
    if (!dirPath) return this.root;

    const parts = dirPath.split("/");
    let currentDir = this.root;

    for (const part of parts) {
      let dir = currentDir.getChild(part) as Directory;
      if (!dir) {
        dir = new Directory(part, currentDir);
        currentDir.addChild(dir);
      }
      currentDir = dir;
    }

    return currentDir;
  }

  // Commit all pending changes to the file system
  async commit(): Promise<UpdateResult> {
    try {
      const result = await this.fileService.batchUpdate(
        this.path,
        this.pendingUpdates
      );

      this.pendingUpdates = []; // Clear pending updates
      this.events.next({ commit: result });
      return result;
    } catch (error) {
      console.error("Failed to commit changes:", error);
      throw error;
    }
  }

  // Discard all pending changes
  discard(): void {
    this.pendingUpdates = [];
    this.load(); // Reload from disk
  }

  // Get project structure statistics
  getStats(): ProjectStats {
    return {
      fileCount: this.root.getAllFiles().length,
      pendingChanges: this.pendingUpdates.length,
      lastUpdated: new Date(),
    };
  }
}
