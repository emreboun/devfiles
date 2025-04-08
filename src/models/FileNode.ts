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

export interface FileNodeCreateInput {
  name: string;
  path: string;
  type: "file" | "directory";
  content?: string;
  metadata?: {
    size?: number;
    lastModified?: Date;
    language?: string;
    dependencies?: string[];
    imports?: string[];
    exports?: string[];
  };
}
