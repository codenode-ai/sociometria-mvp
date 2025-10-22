import app from "../server/vercel";

export default function handler(req: any, res: any) {
  return app(req, res);
}
