export interface FileOperation {
  path: string;
  content?: string;
  type: "read" | "write" | "delete" | "move";
}

export interface ProjectConfig {
  name: string;
  version: string;
  description?: string;
  dependencies?: Record<string, string>;
}

export interface ProjectMetadata {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  config: ProjectConfig;
}
