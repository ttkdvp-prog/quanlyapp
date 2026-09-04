import type { VercelRequest, VercelResponse } from "@vercel/node";
import { google } from "googleapis";

type Row = Record<string, unknown>;

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || "";
const API_KEY = process.env.API_KEY || "";

// Module-scope singletons so a warm serverless invocation reuses the cached
// OAuth access token instead of re-authenticating with Google on every call.
const authClient = new google.auth.JWT({
  email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheetsApi = google.sheets({ version: "v4", auth: authClient });

function sheets() {
  return sheetsApi;
}

// Reads the table and the _meta version in a single round trip.
async function readTableWithVersion(table: string) {
  const res = await sheets().spreadsheets.values.batchGet({
    spreadsheetId: SPREADSHEET_ID,
    ranges: [table, "_meta!A2"],
  });
  const [tableRange, metaRange] = res.data.valueRanges || [];
  const values = tableRange?.values || [];
  const version = Number(metaRange?.values?.[0]?.[0]) || 0;

  if (!values.length) return { headers: [] as string[], rows: [] as Row[], version };
  const headers = values[0].map(String);
  const rows: Row[] = values.slice(1).map((line, i) => {
    const obj: Row = { __row: i + 2 };
    headers.forEach((h, j) => (obj[h] = line[j] ?? ""));
    return obj;
  });
  return { headers, rows, version };
}

async function readTable(table: string) {
  const { headers, rows } = await readTableWithVersion(table);
  return { headers, rows };
}

function isDeleted(r: Row) {
  return r.deleted === true || String(r.deleted).toUpperCase() === "TRUE";
}

async function metaVersion(bump = false): Promise<number> {
  const range = "_meta!A2";
  let current = 0;
  try {
    const res = await sheets().spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range });
    current = Number(res.data.values?.[0]?.[0]) || 0;
  } catch {
    current = 0;
  }
  if (!bump) return current;
  const next = current + 1;
  try {
    await sheets().spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "RAW",
      requestBody: { values: [[next]] },
    });
  } catch {
    // "_meta" sheet not set up (e.g. table created without Apps Script) — skip versioning
    return current;
  }
  return next;
}

function strip(row: Row) {
  const out = { ...row };
  delete out.__row;
  return out;
}

function parseBody(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  if (Buffer.isBuffer(raw)) {
    try {
      return JSON.parse(raw.toString("utf8"));
    } catch {
      return {};
    }
  }
  return raw as Record<string, unknown>;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const p: Record<string, unknown> =
    req.method === "POST" ? { ...req.query, ...parseBody(req.body) } : { ...req.query };

  try {
    if (!API_KEY) throw new Error("API_KEY not configured on server");
    if (p.apiKey !== API_KEY) throw new Error("Unauthorized - invalid API key");

    const table = String(p.table || "apps");
    const action = String(p.action || "list");

    switch (action) {
      case "list": {
        const { headers, rows, version } = await readTableWithVersion(table);
        let data = rows.filter((r) => !isDeleted(r));
        if (p.category) data = data.filter((r) => String(r.category) === String(p.category));
        if (p.q) {
          const q = String(p.q).toLowerCase();
          data = data.filter((r) => headers.some((h) => String(r[h] ?? "").toLowerCase().includes(q)));
        }
        if (p.sort) {
          const [k, dir] = String(p.sort).split(":");
          data.sort((a, b) => {
            if (a[k] === b[k]) return 0;
            const cmp = (a[k] as any) > (b[k] as any) ? 1 : -1;
            return dir === "desc" ? -cmp : cmp;
          });
        }
        const total = data.length;
        const offset = Number(p.offset || 0);
        const limit = Math.min(Number(p.limit || 500), 500);
        return res.status(200).json({
          ok: true,
          error: null,
          data: data.slice(offset, offset + limit).map(strip),
          total,
          version,
        });
      }

      case "get": {
        const { rows, version } = await readTableWithVersion(table);
        const row = rows.find((r) => String(r.id) === String(p.id));
        if (!row) return res.status(200).json({ ok: false, error: "not found", data: null });
        return res.status(200).json({ ok: true, error: null, data: strip(row), version });
      }

      case "create": {
        const { headers } = await readTable(table);
        const version = await metaVersion(true);
        const now = new Date().toISOString();
        const data = (p.data as Row) || {};
        const id = (data.id as string) || crypto.randomUUID();
        const merged: Row = { ...data, id, version, deleted: false, created_at: data.created_at || now, updated_at: now };
        await sheets().spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: table,
          valueInputOption: "RAW",
          insertDataOption: "INSERT_ROWS",
          requestBody: { values: [headers.map((h) => (merged[h] != null ? merged[h] : ""))] },
        });
        return res.status(200).json({ ok: true, error: null, data: merged, version });
      }

      case "update": {
        const { headers, rows } = await readTable(table);
        const target = rows.find((r) => String(r.id) === String(p.id));
        if (!target) return res.status(200).json({ ok: false, error: "not found", data: null });
        const version = await metaVersion(true);
        const data = (p.data as Row) || {};
        const merged: Row = { ...target, ...data, version, updated_at: new Date().toISOString() };
        delete merged.__row;
        await sheets().spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${table}!A${target.__row}:${colLetter(headers.length)}${target.__row}`,
          valueInputOption: "RAW",
          requestBody: { values: [headers.map((h) => (merged[h] != null ? merged[h] : ""))] },
        });
        return res.status(200).json({ ok: true, error: null, data: merged, version });
      }

      case "delete": {
        const { headers, rows } = await readTable(table);
        const target = rows.find((r) => String(r.id) === String(p.id));
        if (!target) return res.status(200).json({ ok: false, error: "not found", data: null });
        const version = await metaVersion(true);
        const merged: Row = { ...target, deleted: true, version, updated_at: new Date().toISOString() };
        delete merged.__row;
        await sheets().spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${table}!A${target.__row}:${colLetter(headers.length)}${target.__row}`,
          valueInputOption: "RAW",
          requestBody: { values: [headers.map((h) => (merged[h] != null ? merged[h] : ""))] },
        });
        return res.status(200).json({ ok: true, error: null, data: { id: target.id, deleted: true }, version });
      }

      case "stream": {
        const since = Number(p.since || 0);
        const { rows, version } = await readTableWithVersion(table);
        const changed = rows.filter((r) => Number(r.version) > since).map(strip);
        return res.status(200).json({ ok: true, error: null, data: changed, version });
      }

      default:
        return res.status(200).json({ ok: false, error: "unknown action", data: null });
    }
  } catch (err: any) {
    return res.status(200).json({ ok: false, error: err?.message || String(err), data: null });
  }
}

function colLetter(n: number): string {
  let s = "";
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - m) / 26);
  }
  return s;
}
