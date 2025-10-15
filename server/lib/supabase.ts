import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseConfigError";
  }
}

type ClientVariant = "admin" | "public";

function requireEnv(name: string, variant: ClientVariant): string {
  const value = process.env[name];
  if (!value) {
    throw new SupabaseConfigError(
      `Missing environment variable ${name} required for Supabase ${variant} client`,
    );
  }
  return value;
}

let cachedAdminClient: SupabaseClient | null = null;
let cachedPublicClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!cachedAdminClient) {
    const url = requireEnv("SUPABASE_URL", "admin");
    const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY", "admin");

    cachedAdminClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: "sociometria",
      },
    });
  }

  return cachedAdminClient;
}

export function getSupabasePublic(): SupabaseClient {
  if (!cachedPublicClient) {
    const url = requireEnv("SUPABASE_URL", "public");
    const key = requireEnv("SUPABASE_ANON_KEY", "public");

    cachedPublicClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: "sociometria",
      },
    });
  }

  return cachedPublicClient;
}

export type SupabaseAdminClient = ReturnType<typeof getSupabaseAdmin>;
