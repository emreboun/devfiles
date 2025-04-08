// src/api/projectRoutes.ts
import express, { Request, Response, NextFunction } from "express";
import { ProjectManager } from "../services/ProjectManager";
import { authenticateUser, authorizeProject } from "../middleware/auth";

const router = express.Router();
const projectManager = new ProjectManager();

// Get project structure
router.get(
  "/projects/:id",
  authenticateUser,
  authorizeProject,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await projectManager.getProject(
        req.params.id,
        req.query.path as string
      );

      res.json({
        id: project.id,
        stats: project.getStats(),
        pendingChanges: project.pendingUpdates.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to load project" });
    }
  }
);

// Get file content
router.get(
  "/projects/:id/files",
  authenticateUser,
  authorizeProject,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await projectManager.getProject(
        req.params.id,
        req.query.projectPath as string
      );

      const filePath = req.query.path as string;
      const file = project.getFile(filePath);

      if (!file) {
        res.status(404).json({ error: "File not found" });
      } else {
        res.json({
          path: filePath,
          content: file.getContent(),
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to get file" });
    }
  }
);

// Update file content (without immediate commit)
router.post(
  "/projects/:id/files",
  authenticateUser,
  authorizeProject,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path, content } = req.body;
      const project = await projectManager.getProject(
        req.params.id,
        req.query.projectPath as string
      );

      project.updateFile(path, content);

      res.json({
        path,
        pendingChanges: project.pendingUpdates.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to update file" });
    }
  }
);

// Create new file (without immediate commit)
router.put(
  "/projects/:id/files",
  authenticateUser,
  authorizeProject,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path, content } = req.body;
      const project = await projectManager.getProject(
        req.params.id,
        req.query.projectPath as string
      );

      project.createFile(path, content);

      res.json({
        path,
        pendingChanges: project.pendingUpdates.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to create file" });
    }
  }
);

// Delete file (without immediate commit)
router.delete(
  "/projects/:id/files",
  authenticateUser,
  authorizeProject,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const path = req.query.path as string;
      const project = await projectManager.getProject(
        req.params.id,
        req.query.projectPath as string
      );

      project.deleteFile(path);

      res.json({
        path,
        pendingChanges: project.pendingUpdates.length,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete file" });
    }
  }
);

// Commit all pending changes
router.post(
  "/projects/:id/commit",
  authenticateUser,
  authorizeProject,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await projectManager.getProject(
        req.params.id,
        req.query.projectPath as string
      );

      const result = await project.commit();

      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: "Failed to commit changes",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  }
);

// Discard all pending changes
router.post(
  "/projects/:id/discard",
  authenticateUser,
  authorizeProject,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await projectManager.getProject(
        req.params.id,
        req.query.projectPath as string
      );

      project.discard();

      res.json({ status: "Changes discarded" });
    } catch (error) {
      res.status(500).json({ error: "Failed to discard changes" });
    }
  }
);

export default router;
