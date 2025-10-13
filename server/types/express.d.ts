import "express-serve-static-core";

declare global {
  namespace Express {
    interface Request {
      accessToken?: string;
      user?: {
        id: string;
        email?: string | null;
      };
      userRole?: "admin" | "user";
    }
  }
}

export {};
