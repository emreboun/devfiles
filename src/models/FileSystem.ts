import { v4 as uuidv4 } from "uuid";

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  content?: string;
  children?: FileNode[];
  metadata: {
    size?: number;
    lastModified?: Date;
    language?: string;
    dependencies?: string[];
    imports?: string[];
    exports?: string[];
  };
}

export class File {
  public readonly id: string;
  public content: string;
  public metadata: Record<string, any>;

  constructor(
    public readonly name: string,
    public parent: Directory | null,
    content: string = "",
    metadata: Record<string, any> = {}
  ) {
    this.id = uuidv4();
    this.content = content;
    this.metadata = metadata;
  }

  setContent(content: string): void {
    this.content = content;
    this.metadata.lastModified = new Date();
  }

  getContent(): string {
    return this.content;
  }

  getPath(): string {
    return this.parent ? `${this.parent.getPath()}/${this.name}` : this.name;
  }
}

export class Directory {
  private children: Map<string, File | Directory> = new Map();

  constructor(public readonly name: string, public parent: Directory | null) {}

  addChild(child: File | Directory): void {
    this.children.set(child.name, child);
  }

  removeChild(name: string): void {
    this.children.delete(name);
  }

  getChild(name: string): File | Directory | undefined {
    return this.children.get(name);
  }

  getAllFiles(): File[] {
    const files: File[] = [];

    for (const child of this.children.values()) {
      if (child instanceof File) {
        files.push(child);
      } else if (child instanceof Directory) {
        files.push(...child.getAllFiles());
      }
    }

    return files;
  }

  findFile(path: string): File | null {
    const parts = path.split("/");
    const name = parts[0];

    if (parts.length === 1) {
      const child = this.children.get(name);
      return child instanceof File ? child : null;
    }

    const child = this.children.get(name);
    if (child instanceof Directory) {
      return child.findFile(parts.slice(1).join("/"));
    }

    return null;
  }

  getPath(): string {
    return this.parent ? `${this.parent.getPath()}/${this.name}` : this.name;
  }
}
