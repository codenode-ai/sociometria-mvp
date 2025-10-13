import { Router } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../lib/supabase";
import { requireAuthenticated } from "../middleware/auth";
import type { House } from "@shared/schema";

const houseInsertSchema = z.object({
  name: z.string().min(1),
  cleaningType: z.enum(["quick", "standard", "meticulous"]),
  size: z.enum(["small", "medium", "large"]),
  address: z.string().optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  notes: z.string().optional().nullable(),
});

const houseUpdateSchema = houseInsertSchema.partial();

type HouseInsertInput = z.infer<typeof houseInsertSchema>;
type HouseUpdateInput = z.infer<typeof houseUpdateSchema>;

type DbHouse = {
  id: string;
  code: string | null;
  name: string;
  cleaning_type: HouseInsertInput["cleaningType"];
  size: HouseInsertInput["size"];
  address: string | null;
  tags: string[] | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function mapToDbPayload(input: HouseInsertInput | HouseUpdateInput) {
  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) {
    payload.name = input.name;
  }
  if (input.cleaningType !== undefined) {
    payload.cleaning_type = input.cleaningType;
  }
  if (input.size !== undefined) {
    payload.size = input.size;
  }
  if (input.address !== undefined) {
    payload.address = input.address ?? null;
  }
  if (input.tags !== undefined) {
    payload.tags = input.tags ?? [];
  }
  if (input.notes !== undefined) {
    payload.notes = input.notes ?? null;
  }

  return payload;
}

function mapFromDbHouse(house: DbHouse): House {
  return {
    id: house.id,
    name: house.name,
    cleaningType: house.cleaning_type,
    size: house.size,
    address: house.address ?? undefined,
    tags: house.tags ?? [],
    notes: house.notes ?? undefined,
  };
}

export const housesRouter = Router();

housesRouter.use(requireAuthenticated);

housesRouter.get("/", async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("houses")
      .select("id, code, name, cleaning_type, size, address, tags, notes, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    const payload = (data ?? []).map((item) => mapFromDbHouse(item as DbHouse));
    res.json(payload);
  } catch (error) {
    next(error);
  }
});

housesRouter.post("/", async (req, res, next) => {
  try {
    const payload = houseInsertSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from("houses")
      .insert(mapToDbPayload(payload))
      .select("id, code, name, cleaning_type, size, address, tags, notes, created_at, updated_at")
      .single();

    if (error || !data) throw error;

    res.status(201).json(mapFromDbHouse(data as DbHouse));
  } catch (error) {
    next(error);
  }
});

housesRouter.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const payload = houseUpdateSchema.parse(req.body);

    const { data, error } = await supabaseAdmin
      .from("houses")
      .update(mapToDbPayload(payload))
      .eq("id", id)
      .select("id, code, name, cleaning_type, size, address, tags, notes, created_at, updated_at")
      .single();

    if (error || !data) throw error;

    res.json(mapFromDbHouse(data as DbHouse));
  } catch (error) {
    next(error);
  }
});

housesRouter.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { error } = await supabaseAdmin.from("houses").delete().eq("id", id);
    if (error) throw error;

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});
