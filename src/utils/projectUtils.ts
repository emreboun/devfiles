import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { ProjectConfig, ProjectMetadata } from "../types";

export async function createProject(
  config: ProjectConfig
): Promise<ProjectMetadata> {
  const metadata: ProjectMetadata = {
    id: uuidv4(),
    createdAt: new Date(),
    updatedAt: new Date(),
    config,
  };

  await fs.writeFile(
    path.join(process.cwd(), "project-metadata.json"),
    JSON.stringify(metadata, null, 2)
  );

  return metadata;
}

export async function loadProject(): Promise<ProjectMetadata> {
  const metadataPath = path.join(process.cwd(), "project-metadata.json");
  const content = await fs.readFile(metadataPath, "utf-8");
  const metadata: ProjectMetadata = JSON.parse(content);

  // Convert string dates back to Date objects
  metadata.createdAt = new Date(metadata.createdAt);
  metadata.updatedAt = new Date(metadata.updatedAt);

  return metadata;
}

export async function updateProject(
  config: Partial<ProjectConfig>
): Promise<ProjectMetadata> {
  const metadata = await loadProject();
  metadata.config = { ...metadata.config, ...config };
  metadata.updatedAt = new Date();

  await fs.writeFile(
    path.join(process.cwd(), "project-metadata.json"),
    JSON.stringify(metadata, null, 2)
  );

  return metadata;
}
