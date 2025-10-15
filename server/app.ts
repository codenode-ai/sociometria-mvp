import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./vite";

/**
 * Cria e configura a aplicação Express
 * Compatível com ambiente Serverless da Vercel.
 */
export function createApp() {
  const app = express();

  // Middleware padrão
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Middleware de log detalhado
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined;

    // Captura da resposta JSON (corrigido para TS 5.6)
    const originalResJson = res.json.bind(res);
    res.json = ((bodyJson: any) => {
      capturedJsonResponse = bodyJson;
      return originalResJson(bodyJson);
    }) as typeof res.json;

    // Log no final da requisição
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          try {
            logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
          } catch {
            logLine += " :: [Unserializable JSON]";
          }
        }
        if (logLine.length > 180) logLine = `${logLine.slice(0, 177)}...`;
        log(logLine);
      }
    });

    next();
  });

  // Registro de rotas principais
  registerRoutes(app);

  // Middleware de tratamento de erros
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });

    const route = req.originalUrl ?? req.path ?? "<unknown>";
    log(`[${status}] ${req.method} ${route}: ${message}`, "error");

    // Stack trace apenas fora de produção
    if (process.env.NODE_ENV !== "production" && err?.stack) {
      console.error(err.stack);
    }
  });

  // Importante: NÃO usar app.listen() em ambiente Serverless!
  return { app };
}

export default createApp;
