import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../lib/supabase";
import { requireAuthenticated } from "../middleware/auth";

const employeeInsertSchema = z.object({
  name: z.string().min(1),
  role: z.enum(["drive", "help", "support"]),
  status: z.enum(["active", "inactive", "leave"]).default("active"),
  traits: z.array(z.string()).optional().default([]),
  preferences: z.array(z.string()).optional().default([]),
  avoidances: z.array(z.string()).optional().default([]),
  notes: z.string().optional().nullable(),
});

const employeeUpdateSchema = employeeInsertSchema.partial();

export const employeesRouter = Router();

employeesRouter.use(requireAuthenticated);

employeesRouter.get("/", async (_req, res, next) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("employees")
      .select(
        "id, code, name, role, status, traits, preferences, avoidances, notes, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json(data ?? []);
  } catch (error) {
    next(error);
  }
});

employeesRouter.post("/", async (req, res, next) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const payload = employeeInsertSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("employees")
      .insert(payload)
      .select(
        "id, code, name, role, status, traits, preferences, avoidances, notes, created_at, updated_at"
      )
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

employeesRouter.put("/:id", async (req, res, next) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = req.params;
    const payload = employeeUpdateSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from("employees")
      .update(payload)
      .eq("id", id)
      .select(
        "id, code, name, role, status, traits, preferences, avoidances, notes, created_at, updated_at"
      )
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    next(error);
  }
});

employeesRouter.delete("/:id", async (req, res, next) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = req.params;
    const { error } = await supabaseAdmin.from("employees").delete().eq("id", id);
    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
