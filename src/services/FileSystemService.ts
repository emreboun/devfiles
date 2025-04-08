// src/services/FileSystemService.ts
import { promises as fs } from "fs";
import path from "path";
import { FileNode, FileNodeCreateInput } from "../models/FileNode";
import { Project, ProjectData } from "../models/Project";
import { v4 as uuidv4 } from "uuid";
import { UpdateOperation, UpdateResult } from "../types/updates";

export class FileSystemService {
  private projects: Map<string, Project> = new Map();

  async createProject(projectPath: string, name: string): Promise<Project> {
    // Create a ProjectData object first
    const projectData: ProjectData = {
      id: uuidv4(),
      name,
      rootPath: projectPath,
      language: "typescript", // default language
      lastUpdated: new Date(),
      metadata: {},
    };

    // Create a Project instance
    const project = new Project(
      projectData.id,
      projectData.name,
      projectData.rootPath,
      projectData.language,
      projectData.metadata,
      this
    );

    // Load the project files
    await project.load();

    this.projects.set(project.id, project);
    return project;
  }

  async buildFileTree(rootPath: string): Promise<FileNode> {
    const stats = await fs.stat(rootPath);
    const name = path.basename(rootPath);

    if (stats.isDirectory()) {
      const children = await fs.readdir(rootPath);
      const childNodes = await Promise.all(
        children.map((child) => this.buildFileTree(path.join(rootPath, child)))
      );

      return {
        id: uuidv4(),
        name,
        path: rootPath,
        type: "directory",
        children: childNodes,
        metadata: {
          lastModified: stats.mtime,
        },
      };
    } else {
      const content = await fs.readFile(rootPath, "utf-8");
      return {
        id: uuidv4(),
        name,
        path: rootPath,
        type: "file",
        content,
        metadata: {
          size: stats.size,
          lastModified: stats.mtime,
        },
      };
    }
  }

  async updateFile(
    projectId: string,
    filePath: string,
    content: string
  ): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Update the file in the project
    project.updateFile(filePath, content);

    // Update on disk
    await fs.writeFile(filePath, content, "utf-8");
  }

  private updateFileInTree(
    node: FileNode,
    targetPath: string,
    content: string
  ): void {
    if (node.path === targetPath && node.type === "file") {
      node.content = content;
      node.metadata.lastModified = new Date();
      return;
    }

    if (node.children) {
      for (const child of node.children) {
        this.updateFileInTree(child, targetPath, content);
      }
    }
  }

  async getFileContent(projectId: string, filePath: string): Promise<string> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    const file = project.getFile(filePath);
    if (!file) {
      throw new Error("File not found");
    }

    return file.content;
  }

  private findFileInTree(node: FileNode, targetPath: string): FileNode | null {
    if (node.path === targetPath) {
      return node;
    }

    if (node.children) {
      for (const child of node.children) {
        const found = this.findFileInTree(child, targetPath);
        if (found) return found;
      }
    }

    return null;
  }

  async saveProjectChanges(projectId: string): Promise<void> {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error("Project not found");
    }

    // Commit the pending updates
    await project.commit();
  }

  private async saveFileTree(node: FileNode): Promise<void> {
    if (node.type === "file" && node.content !== undefined) {
      await fs.writeFile(node.path, node.content, "utf-8");
    }

    if (node.children) {
      for (const child of node.children) {
        await this.saveFileTree(child);
      }
    }
  }

  // Read all files in a project directory
  async readProjectFiles(
    projectPath: string
  ): Promise<{ path: string; content: string }[]> {
    const files: { path: string; content: string }[] = [];

    async function readDir(dirPath: string, relativePath: string = "") {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        const relPath = path.join(relativePath, entry.name);

        if (entry.isDirectory()) {
          await readDir(entryPath, relPath);
        } else {
          // Skip binary files, node_modules, etc.
          if (!shouldSkipFile(relPath)) {
            try {
              const content = await fs.readFile(entryPath, "utf-8");
              files.push({ path: relPath, content });
            } catch (error) {
              console.warn(`Failed to read file ${relPath}:`, error);
            }
          }
        }
      }
    }

    await readDir(projectPath);
    return files;
  }

  // Batch update files in a project directory
  async batchUpdate(
    projectPath: string,
    operations: UpdateOperation[]
  ): Promise<UpdateResult> {
    const results = {
      success: true,
      created: 0,
      updated: 0,
      deleted: 0,
      failed: [] as Array<{ path: string; error: string }>,
    };

    try {
      // Group operations by type for more efficient processing
      const creates = operations.filter((op) => op.type === "create");
      const updates = operations.filter((op) => op.type === "update");
      const deletes = operations.filter((op) => op.type === "delete");

      // Process all creates first (ensure directories exist)
      for (const op of creates) {
        try {
          const filePath = path.join(projectPath, op.path);
          const dirPath = path.dirname(filePath);

          await fs.mkdir(dirPath, { recursive: true });
          await fs.writeFile(filePath, op.content || "");
          results.created++;
        } catch (error) {
          results.success = false;
          results.failed.push({
            path: op.path,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Process updates
      for (const op of updates) {
        try {
          const filePath = path.join(projectPath, op.path);
          await fs.writeFile(filePath, op.content || "");
          results.updated++;
        } catch (error) {
          results.success = false;
          results.failed.push({
            path: op.path,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Process deletes last
      for (const op of deletes) {
        try {
          const filePath = path.join(projectPath, op.path);
          await fs.unlink(filePath);
          results.deleted++;
        } catch (error) {
          results.success = false;
          results.failed.push({
            path: op.path,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return results;
    } catch (error) {
      results.success = false;
      throw error;
    }
  }

  /**
   * Ensure a directory exists, creating it if necessary
   * @param dirPath Directory path
   */
  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}

function shouldSkipFile(filePath: string): boolean {
  // Skip binary files, node_modules, etc.
  const skipPatterns = [
    /node_modules/,
    /\.git/,
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.ico$/,
    /\.woff$/,
    /\.ttf$/,
    /\.eot$/,
    /\.pdf$/,
    /\.zip$/,
  ];

  return skipPatterns.some((pattern) => pattern.test(filePath));
}
