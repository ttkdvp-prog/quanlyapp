/**
 * Quản Lý App — Google Apps Script Backend
 *
 * SETUP INSTRUCTIONS:
 * 1. Open your Google Sheet → Extensions → Apps Script
 * 2. Paste this entire file, replacing any existing code
 * 3. Go to Project Settings → Script Properties and add:
 *    API_KEY        = your-secret-key-here  (same as VITE_API_KEY in .env)
 *    SPREADSHEET_ID = 13F2-yF5Cu8pcL2tOv8SYUshLapvBgLDH2cFgJumfzk0
 * 4. Click Deploy → New Deployment → Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL to your .env as VITE_APPS_SCRIPT_URL
 *
 * SHEET STRUCTURE (row 1 = headers):
 * Sheet "apps":
 *   id | name | description | category | icon | url | links | access_role | status | order | created_at | updated_at | version | deleted
 * Sheet "users":
 *   id | name | email | role | department | avatar | active | version | deleted | created_at | updated_at
 * Sheet "_meta" (auto-created, hidden):
 *   lastVersion (cell A2 = integer counter)
 */

const ENVELOPE_OK = (data, extra) => Object.assign({ ok: true, error: null, data }, extra || {});
const ENVELOPE_ERR = (msg) => ({ ok: false, error: String(msg), data: null });

// ─── Router ──────────────────────────────────────────────────────────────────

function doGet(e) {
  return handle_(e, e.parameter || {});
}

function doPost(e) {
  let body = {};
  try { body = JSON.parse(e.postData && e.postData.contents || "{}"); } catch (_) {}
  return handle_(e, Object.assign({}, e.parameter || {}, body));
}

function handle_(e, p) {
  try {
    requireApiKey_(e, p);
    switch (String(p.action || "list")) {
      case "list":   return json_(list_(p));
      case "get":    return json_(get_(p));
      case "create": return json_(create_(p));
      case "update": return json_(update_(p));
      case "delete": return json_(remove_(p));
      case "stream": return json_(stream_(p));
      default:       return json_(ENVELOPE_ERR("unknown action"));
    }
  } catch (err) {
    return json_(ENVELOPE_ERR(err && err.message || err));
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

function requireApiKey_(e, p) {
  const expected = PropertiesService.getScriptProperties().getProperty("API_KEY");
  if (!expected) throw new Error("API_KEY not set in Script Properties");
  const provided = (p && p.apiKey) || (e && e.parameter && e.parameter.apiKey);
  if (provided !== expected) throw new Error("Unauthorized — invalid API key");
}

// ─── Spreadsheet helpers ─────────────────────────────────────────────────────

function ss_() {
  const id = PropertiesService.getScriptProperties().getProperty("SPREADSHEET_ID");
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error("Sheet not found: " + name);
  return sh;
}

function metaSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName("_meta");
  if (!sh) {
    sh = ss.insertSheet("_meta");
    sh.getRange("A1:B1").setValues([["lastVersion", "_"]]);
    sh.getRange("A2").setValue(0);
    sh.hideSheet();
  }
  return sh;
}

function bumpVersion_() {
  const cell = metaSheet_().getRange("A2");
  const v = (Number(cell.getValue()) || 0) + 1;
  cell.setValue(v);
  return v;
}

function readVersion_() {
  return Number(metaSheet_().getRange("A2").getValue()) || 0;
}

function rows_(sheetName) {
  const sh = sheet_(sheetName);
  const values = sh.getDataRange().getValues();
  if (!values.length) return { headers: [], data: [], sh };
  const headers = values[0].map(String);
  const data = [];
  for (let i = 1; i < values.length; i++) {
    const obj = {};
    for (let j = 0; j < headers.length; j++) obj[headers[j]] = values[i][j];
    obj.__row = i + 1;
    data.push(obj);
  }
  return { headers, data, sh };
}

function stripMeta_(row) {
  const out = Object.assign({}, row);
  delete out.__row;
  return out;
}

function isDeleted_(row) {
  return row.deleted === true || String(row.deleted).toUpperCase() === "TRUE";
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

function list_(p) {
  const { headers, data } = rows_(p.table);
  let rows = data.filter(r => !isDeleted_(r));

  // Category filter (custom for apps table)
  if (p.category) {
    rows = rows.filter(r => String(r.category) === String(p.category));
  }

  // Full-text search
  if (p.q) {
    const q = String(p.q).toLowerCase();
    rows = rows.filter(r => headers.some(h => String(r[h] || "").toLowerCase().includes(q)));
  }

  // Sort
  if (p.sort) {
    const [k, dir] = String(p.sort).split(":");
    rows.sort((a, b) => {
      if (a[k] === b[k]) return 0;
      const cmp = a[k] > b[k] ? 1 : -1;
      return dir === "desc" ? -cmp : cmp;
    });
  }

  const total = rows.length;
  const offset = Number(p.offset || 0);
  const limit = Math.min(Number(p.limit || 500), 500);
  return ENVELOPE_OK(rows.slice(offset, offset + limit).map(stripMeta_), { total, version: readVersion_() });
}

function get_(p) {
  const { data } = rows_(p.table);
  const row = data.find(r => String(r.id) === String(p.id));
  return row ? ENVELOPE_OK(stripMeta_(row), { version: readVersion_() }) : ENVELOPE_ERR("not found");
}

function create_(p) {
  const { headers, sh } = rows_(p.table);
  const v = bumpVersion_();
  const now = new Date();
  const id = (p.data && p.data.id) || Utilities.getUuid();
  const merged = Object.assign({}, p.data, {
    id,
    version: v,
    deleted: false,
    created_at: (p.data && p.data.created_at) || now.toISOString(),
    updated_at: now.toISOString(),
  });
  sh.appendRow(headers.map(h => merged[h] != null ? merged[h] : ""));
  return ENVELOPE_OK(merged, { version: v });
}

function update_(p) {
  const { headers, data, sh } = rows_(p.table);
  const target = data.find(r => String(r.id) === String(p.id));
  if (!target) return ENVELOPE_ERR("not found");
  const v = bumpVersion_();
  const merged = Object.assign({}, target, p.data, {
    version: v,
    updated_at: new Date().toISOString(),
  });
  delete merged.__row;
  sh.getRange(target.__row, 1, 1, headers.length).setValues([headers.map(h => merged[h] != null ? merged[h] : "")]);
  return ENVELOPE_OK(merged, { version: v });
}

function remove_(p) {
  const { headers, data, sh } = rows_(p.table);
  const target = data.find(r => String(r.id) === String(p.id));
  if (!target) return ENVELOPE_ERR("not found");
  const v = bumpVersion_();
  const merged = Object.assign({}, target, {
    deleted: true,
    version: v,
    updated_at: new Date().toISOString(),
  });
  delete merged.__row;
  sh.getRange(target.__row, 1, 1, headers.length).setValues([headers.map(h => merged[h] != null ? merged[h] : "")]);
  return ENVELOPE_OK({ id: target.id, deleted: true }, { version: v });
}

function stream_(p) {
  const since = Number(p.since || 0);
  const { data } = rows_(p.table);
  const changed = data.filter(r => Number(r.version) > since).map(stripMeta_);
  return ENVELOPE_OK(changed, { version: readVersion_() });
}
