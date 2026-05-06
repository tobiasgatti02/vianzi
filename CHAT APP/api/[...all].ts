import serverless from "serverless-http";
import { createServer } from "../src/server.js";

let cached: any;

export default async function handler(req: any, res: any) {
  if (!cached) {
    const app = await createServer();
    cached = serverless(app);
  }
  return cached(req, res);
}
