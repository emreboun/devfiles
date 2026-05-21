// Export types
export * from "./types";

// Export utility functions
export * from "./utils/fileUtils";
export * from "./utils/projectUtils";

// Export main functionality
// TODO: Uncomment these exports once the service modules are created
// export * from "./services/fileService";
// export * from "./services/projectService";

// If you need to expose the Express app for advanced usage
import express from "express";
import { FileService } from "./services/fileService";
import { ProjectService } from "./services/projectService";
export const createApp = (): express.Application => {
  const app = express();
  app.use(express.json());
  return app;
};

const init = async () => {
  try {
    const fileService = new FileService();
    await fileService.writeFile("test.txt", "Hello World");

    const projectService = new ProjectService();
    const project = await projectService.createNewProject({
      name: "my-project",
      version: "1.0.0",
    });
    console.log(project);
  } catch (e) {}
};
console.log("init-start");
init();
console.log("init-finish");
