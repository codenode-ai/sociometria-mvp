﻿import express, { type Request, Response, NextFunction } from "express";
import net from "net";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

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

      if (logLine.length > 80) {
        logLine = `${logLine.slice(0, 77)}...`;
      }

      log(logLine);
    }
  });

  next();
});

async function findAvailablePort(preferredPort: number): Promise<number> {
  const testPort = (port: number) =>
    new Promise<number>((resolve, reject) => {
      const tester = net.createServer();

      tester.once("error", (err) => {
        if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
          resolve(-1);
        } else {
          reject(err);
        }
      });

      tester.once("listening", () => {
        tester.close(() => resolve(port));
      });

      tester.listen(port, "0.0.0.0");
    });

  let port = preferredPort;

  while (true) {
    const available = await testPort(port);
    if (available !== -1) {
      return available;
    }

    port += 1;
  }
}

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const preferredPort = parseInt(process.env.PORT || "5000", 10);
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    log(`port ${preferredPort} already in use, falling back to ${port}`);
  }

  server.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
