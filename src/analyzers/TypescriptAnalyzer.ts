import * as ts from "typescript";
import { FileNode } from "../models/FileNode";
import { File, Directory } from "../models/FileSystem";

export class TypeScriptAnalyzer {
  private program: ts.Program | null = null;
  private fileMap: Map<string, ts.SourceFile> = new Map();

  async analyzeFile(fileNode: FileNode | File): Promise<void> {
    // Check if it's a file with content
    if (!fileNode.content) {
      return;
    }

    // For FileNode type, we need to check if it's a file
    if ("type" in fileNode && fileNode.type !== "file") {
      return;
    }

    const content =
      fileNode instanceof File ? fileNode.content : fileNode.content || "";
    const path = fileNode instanceof File ? fileNode.getPath() : fileNode.path;

    const sourceFile = ts.createSourceFile(
      path,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    this.fileMap.set(path, sourceFile);

    const imports: string[] = [];
    const exports: string[] = [];
    const dependencies: string[] = [];

    // Analyze imports
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier
          .getText()
          .replace(/['"]/g, "");
        imports.push(moduleSpecifier);
        dependencies.push(moduleSpecifier);
      }
    });

    // Analyze exports
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isExportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier
          ?.getText()
          .replace(/['"]/g, "");
        if (moduleSpecifier) {
          exports.push(moduleSpecifier);
        }
      }
    });

    // Update file node metadata
    if (fileNode instanceof File) {
      fileNode.metadata = {
        ...fileNode.metadata,
        language: "typescript",
        imports,
        exports,
        dependencies,
      };
    } else if ("metadata" in fileNode) {
      fileNode.metadata = {
        ...fileNode.metadata,
        language: "typescript",
        imports,
        exports,
        dependencies,
      };
    }
  }

  async analyzeProject(rootNode: FileNode | Directory): Promise<void> {
    if (
      "type" in rootNode &&
      rootNode.type === "directory" &&
      "children" in rootNode &&
      rootNode.children
    ) {
      for (const child of rootNode.children) {
        if (
          "type" in child &&
          child.type === "file" &&
          child.path.endsWith(".ts")
        ) {
          await this.analyzeFile(child);
        } else if ("type" in child && child.type === "directory") {
          await this.analyzeProject(child);
        }
      }
    } else if (rootNode instanceof Directory) {
      // Handle Directory instance
      for (const child of rootNode.getAllFiles()) {
        if (child.name.endsWith(".ts")) {
          await this.analyzeFile(child);
        }
      }
    }
  }

  updateFile(path: string, content: string): void {
    const sourceFile = ts.createSourceFile(
      path,
      content,
      ts.ScriptTarget.Latest,
      true
    );
    this.fileMap.set(path, sourceFile);
  }

  addFile(path: string, content: string): void {
    this.updateFile(path, content);
  }

  removeFile(path: string): void {
    this.fileMap.delete(path);
  }
}
