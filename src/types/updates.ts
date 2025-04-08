export type UpdateOperationType = "create" | "update" | "delete";

export interface UpdateOperation {
  type: UpdateOperationType;
  path: string;
  content?: string;
  metadata?: Record<string, any>;
}

export interface UpdateResult {
  success: boolean;
  created: number;
  updated: number;
  deleted: number;
  failed: Array<{ path: string; error: string }>;
}

export interface ProjectStats {
  fileCount: number;
  pendingChanges: number;
  lastUpdated: Date;
}
