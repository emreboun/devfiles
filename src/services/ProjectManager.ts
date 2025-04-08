// src/services/ProjectManager.ts
import { Project } from "../models/Project";
import { FileSystemService } from "./FileSystemService";
import { Observable, Subject } from "rxjs";
import { filter, map } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";

export class ProjectManager {
  private projects: Map<string, Project> = new Map();
  private fileSystemService: FileSystemService;
  private projectEvents = new Subject<{
    projectId: string;
    event: string;
    data?: any;
  }>();

  constructor() {
    this.fileSystemService = new FileSystemService();
  }

  /**
   * Get a project by ID
   * @param id Project ID
   * @param projectPath Optional path to load project from
   * @returns Project instance
   */
  async getProject(id: string, projectPath?: string): Promise<Project> {
    // Check if project is already loaded
    let project = this.projects.get(id);

    if (project) {
      return project;
    }

    // If project path is provided, load the project
    if (projectPath) {
      project = await this.loadProject(id, projectPath);
      return project;
    }

    throw new Error(`Project with ID ${id} not found`);
  }

  /**
   * Load a project from disk
   * @param id Project ID
   * @param projectPath Path to project directory
   * @returns Project instance
   */
  async loadProject(id: string, projectPath: string): Promise<Project> {
    // Check if project already exists
    if (this.projects.has(id)) {
      throw new Error(`Project with ID ${id} already exists`);
    }

    // Create a new project
    const project = new Project(
      id,
      projectPath.split("/").pop() || id,
      projectPath,
      "typescript",
      {},
      this.fileSystemService
    );

    // Load project files
    await project.load();

    // Store project in memory
    this.projects.set(id, project);

    return project;
  }

  /**
   * Create a new project
   * @param name Project name
   * @param projectPath Path to project directory
   * @returns Project instance
   */
  async createProject(name: string, projectPath: string): Promise<Project> {
    const id = uuidv4();

    // Create project directory if it doesn't exist
    await this.fileSystemService.ensureDirectoryExists(projectPath);

    // Create a new project
    const project = new Project(
      id,
      name,
      projectPath,
      "typescript",
      {},
      this.fileSystemService
    );

    // Store project in memory
    this.projects.set(id, project);

    return project;
  }

  /**
   * Delete a project
   * @param id Project ID
   */
  async deleteProject(id: string): Promise<void> {
    const project = this.projects.get(id);

    if (!project) {
      throw new Error(`Project with ID ${id} not found`);
    }

    // Remove project from memory
    this.projects.delete(id);

    // Note: In a real app, you might want to delete the project directory
    // or mark it as deleted in a database
  }

  /**
   * Get all projects
   * @returns Array of project IDs
   */
  getAllProjects(): string[] {
    return Array.from(this.projects.keys());
  }

  // Get observable for project events
  getProjectEvents(
    projectId?: string
  ): Observable<{ projectId: string; event: string; data?: any }> {
    if (projectId) {
      return this.projectEvents.pipe(filter((e) => e.projectId === projectId));
    }
    return this.projectEvents.asObservable();
  }

  // Close a project and write all pending changes
  async closeProject(id: string, saveChanges: boolean = true): Promise<void> {
    const project = this.projects.get(id);
    if (project) {
      if (saveChanges && project.pendingUpdates.length > 0) {
        await project.commit();
      }
      this.projects.delete(id);
    }
  }

  // Clean up resources
  async dispose(): Promise<void> {
    for (const [id, project] of this.projects.entries()) {
      await this.closeProject(id, true);
    }
  }
}
