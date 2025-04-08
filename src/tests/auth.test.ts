import { Request, Response } from "express";
import { authenticateUser, authorizeProject } from "../middleware/auth";

describe("Authentication Middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      params: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  describe("authenticateUser", () => {
    it("should return 401 if no authorization header is present", async () => {
      await authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Authentication required",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 401 if authorization header is invalid", async () => {
      mockRequest.headers = {
        authorization: "InvalidFormat",
      };

      await authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid authentication format",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should return 401 if credentials are invalid", async () => {
      mockRequest.headers = {
        authorization: "Bearer invalid:credentials",
      };

      await authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid credentials",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should call next if credentials are valid", async () => {
      mockRequest.headers = {
        authorization: "Bearer admin:admin123",
      };

      await authenticateUser(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as any).user).toEqual({
        id: "1",
        username: "admin",
        role: "admin",
      });
    });
  });

  describe("authorizeProject", () => {
    beforeEach(() => {
      // Set up authenticated user
      (mockRequest as any).user = {
        id: "1",
        username: "admin",
        role: "admin",
      };
    });

    it("should return 403 if user does not have permission for the project", async () => {
      mockRequest.params = {
        id: "999", // Non-existent project ID
      };

      await authorizeProject(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "You do not have permission to access this project",
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it("should call next if user has permission for the project", async () => {
      mockRequest.params = {
        id: "1", // Project ID that user has permission for
      };

      await authorizeProject(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as any).projectPermission).toEqual({
        userId: "1",
        projectId: "1",
        role: "owner",
      });
    });
  });
});
