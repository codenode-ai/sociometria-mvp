import { createApp } from "../server/app";

const { app } = createApp();

export default function handler(req: unknown, res: unknown) {
  return app(req as any, res as any);
}
