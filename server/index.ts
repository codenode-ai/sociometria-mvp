import express, { type Request, Response, NextFunction } from "express";
import net from "net";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// ------------------------------------------------------------
// 1️⃣ Criação do app
// ------------------------------------------------------------
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) logLine = `${logLine.slice(0, 77)}...`;
      log(logLine);
    }
  });

  next();
});

// ------------------------------------------------------------
// 2️⃣ Exporta o app (necessário para Vercel serverless)
// ------------------------------------------------------------
export default app;

// ------------------------------------------------------------
// 3️⃣ Função auxiliar local (apenas usada fora da Vercel)
// ------------------------------------------------------------
async function findAvailablePort(preferredPort: number): Promise<number> {
  const testPort = (port: number) =>
    new Promise<number>((resolve, reject) => {
      const tester = net.createServer();
      tester.once("error", (err) => {
        if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
          resolve(-1);
        } else reject(err);
      });
      tester.once("listening", () => {
        tester.close(() => resolve(port));
      });
      tester.listen(port, "0.0.0.0");
    });

  let port = preferredPort;
  while (true) {
    const available = await testPort(port);
    if (available !== -1) return available;
    port += 1;
  }
}

// ------------------------------------------------------------
// 4️⃣ Execução local (ignorada pela Vercel)
// ------------------------------------------------------------
if (!process.env.VERCEL) {
  (async () => {
    await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      throw err;
    });

    if (app.get("env") === "development") {
      await setupVite(app);
    } else {
      serveStatic(app);
    }

    const preferredPort = parseInt(process.env.PORT || "5001", 10);
    const port = await findAvailablePort(preferredPort);
    if (port !== preferredPort)
      log(`port ${preferredPort} already in use, falling back to ${port}`);

    app.listen({ port, host: "0.0.0.0" }, () => {
      log(`serving on port ${port}`);
    });
  })();
} else {
  // Ambiente Vercel: apenas registra rotas e serve estáticos
  (async () => {
    await registerRoutes(app);
    serveStatic(app);
  })();
}
