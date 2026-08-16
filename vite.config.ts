import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Dev-only: run api/sheets.ts's handler in-process so `npm run dev` can hit
// /api/sheets the same way Vercel's serverless runtime does in production.
function apiSheetsDevMiddleware(): Plugin {
  return {
    name: "api-sheets-dev-middleware",
    configureServer(server) {
      server.middlewares.use("/api/sheets", async (req, res) => {
        const { default: handler } = await server.ssrLoadModule("/api/sheets.ts");
        const url = new URL(req.url || "", "http://localhost");
        const query = Object.fromEntries(url.searchParams);
        let body: unknown = undefined;
        if (req.method === "POST") {
          const chunks: Buffer[] = [];
          for await (const chunk of req) chunks.push(chunk as Buffer);
          try {
            body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
          } catch {
            body = {};
          }
        }
        const vercelReq = Object.assign(req, { query, body });
        const vercelRes = Object.assign(res, {
          status(code: number) {
            res.statusCode = code;
            return vercelRes;
          },
          json(payload: unknown) {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(payload));
            return vercelRes;
          },
        });
        await handler(vercelReq as any, vercelRes as any);
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Also load unprefixed vars (GOOGLE_*, API_KEY) into process.env for the
  // dev middleware above — Vite only auto-exposes VITE_* to import.meta.env.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: [react(), tailwindcss(), apiSheetsDevMiddleware()],
  };
});
