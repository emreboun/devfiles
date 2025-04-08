import { ProjectConfig, ProjectMetadata } from "../types";
import {
  createProject,
  loadProject,
  updateProject,
} from "../utils/projectUtils";

export class ProjectService {
  async createNewProject(config: ProjectConfig): Promise<ProjectMetadata> {
    return createProject(config);
  }

  async getCurrentProject(): Promise<ProjectMetadata> {
    return loadProject();
  }

  async updateProjectConfig(
    config: Partial<ProjectConfig>
  ): Promise<ProjectMetadata> {
    return updateProject(config);
  }
}
