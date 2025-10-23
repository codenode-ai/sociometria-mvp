import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Erro customizado para falhas de configuração do Supabase.
 */
export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

type ClientVariant = "admin" | "public";

/**
 * Valida se a variável de ambiente existe.
 */
function requireEnv(name: string, variant: ClientVariant): string {
  const value = process.env[name];
  if (!value) {
    throw new SupabaseConfigError(
      `Missing environment variable ${name} required for Supabase ${variant} client`
    );
  }
  return value;
}

type AnySupabaseClient = SupabaseClient<any, any, any, any, any>;

/**
 * Armazena clientes criados para evitar recriação em execução local.
 * Em ambiente serverless, isso é recriado por invocação — o cache é seguro.
 */
let cachedAdminClient: AnySupabaseClient | null = null;
let cachedPublicClient: AnySupabaseClient | null = null;

/**
 * Cria (ou retorna) o cliente com a chave de serviço (Service Role Key).
 * Uso: operações administrativas e do servidor.
 */
export function getSupabaseAdmin(): AnySupabaseClient {
  if (!cachedAdminClient) {
    const url = requireEnv("SUPABASE_URL", "admin");
    const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY", "admin");

    cachedAdminClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: "sociometria", // 🔧 altere aqui se quiser outro schema padrão
      },
      global: {
        headers: { "x-application-name": "sociometria-mvp-admin" },
      },
    });
  }

  return cachedAdminClient;
}

/**
 * Cria (ou retorna) o cliente público (Anon Key).
 * Uso: queries seguras feitas pelo cliente.
 */
export function getSupabasePublic(): AnySupabaseClient {
  if (!cachedPublicClient) {
    const url = requireEnv("SUPABASE_URL", "public");
    const key = requireEnv("SUPABASE_ANON_KEY", "public");

    cachedPublicClient = createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true, // ✅ mantido para sessões de usuário autenticado
      },
      db: {
        schema: "sociometria",
      },
      global: {
        headers: { "x-application-name": "sociometria-mvp-client" },
      },
    });
  }

  return cachedPublicClient;
}

/**
 * Tipagem útil para quando for importar os tipos de client.
 */
export type SupabaseAdminClient = ReturnType<typeof getSupabaseAdmin>;
export type SupabasePublicClient = ReturnType<typeof getSupabasePublic>;
