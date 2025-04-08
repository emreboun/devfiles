import { Request, Response, NextFunction } from "express";
import { ProjectManager } from "../services/ProjectManager";

// Mock user data - in a real app, this would come from a database
const users = [
  { id: "1", username: "admin", password: "admin123", role: "admin" },
  { id: "2", username: "user", password: "user123", role: "user" },
];

// Mock project permissions - in a real app, this would come from a database
const projectPermissions = [
  { userId: "1", projectId: "1", role: "owner" },
  { userId: "1", projectId: "2", role: "editor" },
  { userId: "2", projectId: "2", role: "viewer" },
];

/**
 * Middleware to authenticate users
 * Checks for a valid JWT token in the Authorization header
 */
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    /* // In a real app, you would validate a JWT token here
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // For this example, we'll use a simple token format: "Bearer username:password"
    const token = authHeader.split(" ")[1];
    if (!token) {
      res.status(401).json({ error: "Invalid authentication format" });
      return;
    }

    const [username, password] = token.split(":");
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Add user to request object for later use
    (req as any).user = {
      id: user.id,
      username: user.username,
      role: user.role,
    }; */

    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

/**
 * Middleware to authorize project access
 * Checks if the authenticated user has permission to access the project
 */
export const authorizeProject = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    /* const userId = (req as any).user.id;
    const projectId = req.params.id;

    // Check if user has permission for this project
    const permission = projectPermissions.find(
      (p) => p.userId === userId && p.projectId === projectId
    );

    if (!permission) {
      res
        .status(403)
        .json({ error: "You do not have permission to access this project" });
      return;
    }

    // Add permission to request object for later use
    (req as any).projectPermission = permission; */

    next();
  } catch (error) {
    console.error("Authorization error:", error);
    res.status(500).json({ error: "Authorization failed" });
  }
};

/**
 * Middleware to check if user has a specific role for a project
 * @param roles Array of allowed roles
 */
export const requireProjectRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const permission = (req as any).projectPermission;

    if (!permission) {
      res.status(403).json({ error: "Project permission not found" });
      return;
    }

    if (!roles.includes(permission.role)) {
      res.status(403).json({
        error: "You do not have the required role for this operation",
      });
      return;
    }

    next();
  };
};
