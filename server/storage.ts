import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export interface User {
  id: string;
  username: string;
  passwordHash: string;
}

export type InsertUser = Omit<User, "id">;

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

// Cria o cliente Supabase usando variáveis de ambiente
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Implementação de storage persistente usando Supabase.
 */
export class SupabaseStorage implements IStorage {
  private table = "users"; // nome da tabela no Supabase

  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from(this.table)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Erro ao buscar usuário:", error.message);
      return undefined;
    }

    return data as User | undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from(this.table)
      .select("*")
      .eq("username", username)
      .single();

    if (error) {
      if (error.code !== "PGRST116") console.error("Erro ao buscar usuário:", error.message);
      return undefined;
    }

    return data as User | undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };

    const { error } = await supabase.from(this.table).insert([user]);

    if (error) throw new Error(`Erro ao criar usuário: ${error.message}`);

    return user;
  }
}

// Exporta uma instância única
export const storage = new SupabaseStorage();

