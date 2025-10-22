import "dotenv/config";
import express from "express";
import { registerRoutes } from "./routes";

const app = express();
registerRoutes(app);

if (process.env.VERCEL) {
  // 🔹 Ambiente Vercel: exporta o handler em vez de ouvir porta
  export default app;
} else {
  // 🔹 Ambiente local: inicia o servidor normalmente
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`[express] serving on port ${PORT}`);
  });
}