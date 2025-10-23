import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { log } from "./vite";
import { SupabaseConfigError } from "./lib/supabase";

/**
 * Cria e configura a aplicação Express
 * Compatível com o modelo Serverless da Vercel.
 */
export function createApp() {
  const app = express();

  // ---------- Middlewares padrão ----------
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // ---------- Log de requisições detalhado ----------
  app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined;

    // Captura da resposta JSON
    const originalResJson = res.json.bind(res);
    res.json = ((bodyJson: any) => {
      capturedJsonResponse = bodyJson;
      return originalResJson(bodyJson);
    }) as typeof res.json;

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

  // ---------- Registro das rotas ----------
  registerRoutes(app);

  // ---------- Middleware de tratamento de erros ----------
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const isConfigError = err instanceof SupabaseConfigError;
    const status = isConfigError ? 500 : err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });

    const route = req.originalUrl ?? req.path ?? "<unknown>";
    log(`[${status}] ${req.method} ${route}: ${message}`, "error");

    // Em ambiente local, loga stacktrace
    if (process.env.NODE_ENV !== "production" && err?.stack) {
      console.error(err.stack);
    }
  });

  // ⚠️ Importante: NUNCA usar app.listen() no modo Serverless.
  return { app };
}

/**
 * Exportação padrão:
 *  - compatível com import dinâmico da Vercel;
 *  - evita execução fora do ciclo da Function.
 */
export default createApp;
