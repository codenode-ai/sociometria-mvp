import type { RequestHandler } from "express";
import { supabaseAdmin } from "../lib/supabase";

type UserRole = "admin" | "user";

export const authenticateRequest: RequestHandler = async (req, _res, next) => {
  try {
    const authHeader = req.header("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      return next();
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      return next();
    }

    req.user = {
      id: data.user.id,
      email: data.user.email,
    };
    req.accessToken = token;

    const { data: profile } = await supabaseAdmin
      .from("user_profiles")
      .select("role")
      .eq("user_id", data.user.id)
      .single();

    req.userRole = (profile?.role as UserRole) ?? "user";
  } catch (_error) {
    // ignore token parsing errors and proceed without user context
  }

  next();
};

export const requireAuthenticated: RequestHandler = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

export const requireAdmin: RequestHandler = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  if (req.userRole !== "admin") {
    return res.status(403).json({ message: "Administrator role required" });
  }
  next();
};
