import { Router } from "express";
import { FileSystemService } from "../services/FileSystemService";
import { TypeScriptAnalyzer } from "../analyzers/TypescriptAnalyzer";

const router = Router();
const fileSystemService = new FileSystemService();
const typescriptAnalyzer = new TypeScriptAnalyzer();

// Create a new project
router.post("/projects", async (req, res) => {
  try {
    const { projectPath, name } = req.body;
    const project = await fileSystemService.createProject(projectPath, name);
    await typescriptAnalyzer.analyzeProject(project.root);
    res.json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Unknown error occurred" });
  }
});

// Get file content
router.get("/projects/:projectId/files", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { filePath } = req.query;
    const content = await fileSystemService.getFileContent(
      projectId,
      filePath as string
    );
    res.json({ content });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Unknown error occurred" });
  }
});

// Update file content
router.put("/projects/:projectId/files", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { filePath, content } = req.body;
    await fileSystemService.updateFile(projectId, filePath, content);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Unknown error occurred" });
  }
});

// Save project changes
router.post("/projects/:projectId/save", async (req, res) => {
  try {
    const { projectId } = req.params;
    await fileSystemService.saveProjectChanges(projectId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Unknown error occurred" });
  }
});

export default router;
