import type { Express, Request, Response, NextFunction } from "express";
import { Router } from "express";
import { employeesRouter } from "./api/employees";
import { housesRouter } from "./api/houses";
import { testsRouter } from "./api/tests";
import { authRouter } from "./api/auth";
import { authenticateRequest } from "./middleware/auth";

/**
 * Registra todas as rotas da API.
 * Adaptado para ambiente Serverless (sem createServer).
 */
export function registerRoutes(app: Express): void {
  const apiRouter = Router();

  // Rotas públicas
  apiRouter.use("/auth", authRouter);

  // Middleware de autenticação para as demais rotas
  apiRouter.use(authenticateRequest);

  // Rotas protegidas
  apiRouter.use("/employees", employeesRouter);
  apiRouter.use("/houses", housesRouter);
  apiRouter.use("/tests", testsRouter);

  // Prefixo da API
  app.use("/api", apiRouter);

  // Tratamento de 404 específico para /api
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "Not Found" });
    }
    return next();
  });
}

