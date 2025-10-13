import net from "net";
import { createApp } from "./app";
import { setupVite, serveStatic, log } from "./vite";

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
  const { app, server } = createApp();

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
