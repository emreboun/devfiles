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
export const createApp = (): express.Application => {
  const app = express();
  app.use(express.json());
  return app;
};
