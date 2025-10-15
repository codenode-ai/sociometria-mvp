import { Router } from "express";
import { z } from "zod";
import { getSupabaseAdmin } from "../lib/supabase";
import { requireAuthenticated, requireAdmin } from "../middleware/auth";

const optionSchema = z.object({
  id: z.string().optional(),
  weight: z.number().int().min(1).max(4),
  label: z.string().min(1),
});

const questionSchema = z.object({
  id: z.string().optional(),
  questionKey: z.string().optional(),
  prompt: z.string().min(1),
  dimension: z.string().optional(),
  helpText: z.string().optional(),
  options: z.array(optionSchema).min(1),
});

const bandSchema = z.object({
  id: z.string().optional(),
  bandKey: z.string().optional(),
  label: z.string().min(1),
  description: z.string().optional(),
  color: z.string().optional(),
  min: z.number().int(),
  max: z.number().int(),
});

const testPayloadSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  language: z.enum(["pt", "en", "es"]),
  availableLanguages: z.array(z.enum(["pt", "en", "es"])).optional(),
  tags: z.array(z.string()).optional(),
  estimatedDurationMinutes: z.number().int().optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
  historyNote: z.string().optional(),
  author: z.string().optional(),
  questions: z.array(questionSchema).length(10),
  interpretationBands: z.array(bandSchema).min(1),
});

const testIdSchema = z.object({ id: z.string().uuid() });

export const testsRouter = Router();

// requer token válido para qualquer acesso ao módulo
testsRouter.use(requireAuthenticated);

function mapRpcTest(result: unknown) {
  const schema = z.object({
    id: z.string().uuid(),
    slug: z.string(),
    title: z.string(),
    description: z.string(),
    language: z.string(),
    availableLanguages: z.array(z.string()),
    status: z.string().nullable(),
    tags: z.array(z.string()).nullable(),
    estimatedDurationMinutes: z.number().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    version: z.number().int(),
    history: z
      .array(
        z.object({
          version: z.number().int(),
          note: z.string().nullable(),
          author: z.string().nullable(),
          createdAt: z.string(),
        })
      )
      .nullable(),
    questions: z
      .array(
        z.object({
          id: z.string().uuid(),
          questionKey: z.string(),
          prompt: z.string(),
          dimension: z.string().nullable(),
          helpText: z.string().nullable(),
          position: z.number().int(),
          options: z.array(
            z.object({
              id: z.string().uuid(),
              weight: z.number().int(),
              label: z.string(),
            })
          ),
        })
      )
      .nullable(),
    interpretationBands: z
      .array(
        z.object({
          id: z.string().uuid(),
          bandKey: z.string(),
          label: z.string(),
          description: z.string().nullable(),
          color: z.string().nullable(),
          min: z.number().int(),
          max: z.number().int(),
        })
      )
      .nullable(),
  });

  const parsed = schema.parse(result);
  return {
    ...parsed,
    tags: parsed.tags ?? [],
    interpretationBands: parsed.interpretationBands ?? [],
    questions: parsed.questions ?? [],
    history: parsed.history ?? [],
  };
}

testsRouter.get("/", async (_req, res, next) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.rpc("get_psychological_tests");
    if (error) throw error;
    const mapped = (data ?? []).map(mapRpcTest);
    res.json(mapped);
  } catch (error) {
    next(error);
  }
});

testsRouter.get("/:id", async (req, res, next) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = testIdSchema.parse(req.params);
    const { data, error } = await supabaseAdmin.rpc("get_psychological_test", { p_test_id: id });
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ message: "Test not found" });
    }
    res.json(mapRpcTest(data));
  } catch (error) {
    next(error);
  }
});

testsRouter.post("/", requireAdmin, async (req, res, next) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const payload = testPayloadSchema.parse(req.body);
    const { data, error } = await supabaseAdmin.rpc("create_psychological_test", { p_payload: payload });
    if (error) throw error;
    res.status(201).json(mapRpcTest(data));
  } catch (error) {
    next(error);
  }
});

testsRouter.put("/:id", requireAdmin, async (req, res, next) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = testIdSchema.parse(req.params);
    const payload = testPayloadSchema.parse(req.body);
    const { data, error } = await supabaseAdmin.rpc("update_psychological_test", { p_test_id: id, p_payload: payload });
    if (error) throw error;
    res.json(mapRpcTest(data));
  } catch (error) {
    next(error);
  }
});

testsRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { id } = testIdSchema.parse(req.params);
    const { error } = await supabaseAdmin.rpc("delete_psychological_test", { p_test_id: id });
    if (error) throw error;
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
