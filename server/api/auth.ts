import { Router } from "express";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../lib/supabase";

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
}

const supabasePublic = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(2).max(120),
});

export const authRouter = Router();

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const { data, error } = await supabasePublic.auth.signInWithPassword({ email, password });
    if (error || !data.session) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("role, display_name")
      .eq("user_id", data.user.id)
      .single();

    const displayName =
      profile?.display_name ??
      (data.user.user_metadata?.display_name as string | undefined) ??
      data.user.email ??
      null;

    return res.json({
      accessToken: data.session.access_token,
      role: profile?.role ?? "user",
      displayName,
      email: data.user.email,
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const { email, password, displayName } = registerSchema.parse(req.body);

    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        display_name: displayName,
      },
    });

    if (createError || !createData.user) {
      const status = createError?.status ?? 500;
      if (status === 422 || status === 409 || status === 400) {
        return res.status(409).json({ message: "User already exists" });
      }
      return res.status(status).json({ message: createError?.message ?? "Failed to create user" });
    }

    await supabaseAdmin
      .from("user_profiles")
      .update({ display_name: displayName })
      .eq("user_id", createData.user.id);

    const { data: signInData, error: signInError } = await supabasePublic.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.session) {
      return res.status(201).json({ message: "Account created, login required" });
    }

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("role")
      .eq("user_id", createData.user.id)
      .single();

    const displayNameResponse =
      displayName ??
      (createData.user.user_metadata?.display_name as string | undefined) ??
      createData.user.email ??
      null;

    return res.status(201).json({
      accessToken: signInData.session.access_token,
      role: profile?.role ?? "user",
      displayName: displayNameResponse,
      email: createData.user.email,
    });
  } catch (error) {
    next(error);
  }
});
