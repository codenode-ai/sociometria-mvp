import type { Express, Request, Response, NextFunction } from "express";
import { Router } from "express";
import { createServer, type Server } from "http";
import { employeesRouter } from "./api/employees";
import { housesRouter } from "./api/houses";
import { testsRouter } from "./api/tests";
import { authRouter } from "./api/auth";
import { authenticateRequest } from "./middleware/auth";

export function registerRoutes(app: Express): Server {
  const apiRouter = Router();

  apiRouter.use("/auth", authRouter);

  apiRouter.use(authenticateRequest);

  apiRouter.use("/employees", employeesRouter);
  apiRouter.use("/houses", housesRouter);
  apiRouter.use("/tests", testsRouter);

  app.use("/api", apiRouter);

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "Not Found" });
    }
    return next();
  });

  return createServer(app);
}
