import "dotenv/config";
import net from "net";
import http from "http";
import { createApp } from "./app";
import { setupVite, serveStatic, log } from "./vite";

// Função para verificar se estamos em ambiente serverless
function isServerlessEnvironment(): boolean {
  return !!process.env.VERCEL || !!process.env.NETLIFY || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
}

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

// Somente inicia o servidor se NÃO estiver em ambiente serverless
if (!isServerlessEnvironment()) {
  (async () => {
    // Verificar se as variáveis de ambiente estão disponíveis
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      log("ERROR: Missing required environment variables for Supabase", "error");
      log("Please check your .env.local file contains:", "error");
      log("- SUPABASE_URL", "error");
      log("- SUPABASE_ANON_KEY", "error");
      log("- SUPABASE_SERVICE_ROLE_KEY", "error");
      process.exit(1);
    }

    const { app } = createApp();
    
    // Criar o servidor HTTP e vincular ao app Express
    const server = http.createServer(app);

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const preferredPort = parseInt(process.env.PORT || "5001", 10);
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
} else {
  // Em ambiente serverless, simplesmente exportamos a função createApp
  // para ser usada pelo handler no api/index.ts
  log("Running in serverless environment, skipping direct server startup");
}
