import "dotenv/config";
import express from "express";
import { createApp } from "./app"; // Usando a função createApp que já tem todos os middlewares configurados

const { app } = createApp();

// Exportar o app para uso em ambiente serverless
export default app;

// Apenas iniciar o servidor se NÃO estiver em ambiente serverless
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5001;
  
  // Verificar se as variáveis de ambiente estão disponíveis
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("ERROR: Missing required environment variables for Supabase");
    console.error("Please check your .env.local file contains:");
    console.error("- SUPABASE_URL");
    console.error("- SUPABASE_ANON_KEY");
    console.error("- SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  
  app.listen(PORT, () => {
    console.log(`[express] serving on port ${PORT}`);
  });
}