// server/vercel.ts
import { createApp } from "./app";

/**
 * Exporta o Express app de forma compatível com o modelo Serverless da Vercel.
 * Não executa nada fora do contexto de inicialização — a Vercel cuida do servidor.
 */

const createHandler = () => {
  const { app } = createApp();
  return app;
};

export default createHandler();
