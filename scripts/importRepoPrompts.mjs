#!/usr/bin/env node
/**
 * Import selected prompts from repo-index.json into local JSON and optionally into the DB via admin API.
 * - Reads ./repo-index.json (created via fetchRepoPrompts.mjs)
 * - Fetches raw content for each selected item
 * - Strips @mentions
 * - Adds GPL-3.0 attribution and source links
 * - Maps to Prisma Prompt-like JSON for seeding
 *
 * Usage (PowerShell examples):
 *   node scripts/importRepoPrompts.mjs                       # export JSON only
 *   SEED_SECRET=devsecret node scripts/importRepoPrompts.mjs # seed via admin API
 *
 * Env:
 *   SEED_SECRET   - if set, will POST to admin seed endpoint
 *   SEED_URL      - admin endpoint (default http://localhost:3000/api/admin/seed-repo)
 *   IMPORT_OWNER  - owner to assign (default ENV PAYOUT_WALLET or 'SEED_SYSTEM')
 *   IMPORT_PRICE  - default price (default 0)
 *   IMPORT_CATEGORY - category to assign (default 'external')
 *   IMPORT_LIMIT  - optional max number to import
 */

import fs from 'node:fs';
import path from 'node:path';
import { URL } from 'node:url';
import http from 'node:http';
import https from 'node:https';

const ROOT = process.cwd();
const INDEX_FILE = path.resolve(ROOT, 'repo-index.json');
const OUT_DIR = path.resolve(ROOT, 'data');
const OUT_FILE = path.resolve(OUT_DIR, 'repo_import.json');

const IMPORT_OWNER = process.env.IMPORT_OWNER || process.env.PAYOUT_WALLET || 'SEED_SYSTEM';
const DEFAULT_PRICE = Number(process.env.IMPORT_PRICE || 0);
const CATEGORY = process.env.IMPORT_CATEGORY || 'external';
const LIMIT = process.env.IMPORT_LIMIT ? Number(process.env.IMPORT_LIMIT) : undefined;
const INCLUDE_FOLDERS = (process.env.INCLUDE_FOLDERS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);
const EXCLUDE_FOLDERS = (process.env.EXCLUDE_FOLDERS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const SEED_SECRET = process.env.SEED_SECRET;
const ADMIN_URL = process.env.SEED_URL || 'http://localhost:3000/api/admin/seed-gpt';

function stripAtMentions(str = '') {
  return String(str)
    .replace(/(^|\s)@[^\s.,;:!?)\]}]+/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function postJSON(urlStr, body, headers = {}) {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const data = Buffer.from(JSON.stringify(body));
      const isHttps = u.protocol === 'https:';
      const opts = {
        method: 'POST',
        hostname: u.hostname,
        port: u.port || (isHttps ? 443 : 80),
        path: u.pathname + (u.search || ''),
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length,
          ...headers
        }
      };
      const req = (isHttps ? https : http).request(opts, (res) => {
        let out = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => { out += chunk; });
        res.on('end', () => {
          const ok = res.statusCode && res.statusCode >= 200 && res.statusCode < 300;
          resolve({ ok, status: res.statusCode || 0, text: out });
        });
      });
      req.on('error', (err) => resolve({ ok: false, status: 0, text: String(err?.message || 'error') }));
      req.write(data);
      req.end();
    } catch (e) {
      resolve({ ok: false, status: 0, text: String(e?.message || 'error') });
    }
  });
}

async function tryFetch(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) return null;
  return await res.text();
}

function buildAttribution(item) {
  const sourceRepo = 'x1xhlol/system-prompts-and-models-of-ai-tools';
  const license = 'GPL-3.0';
  return `Source: ${sourceRepo} (${license})\nFolder: ${item.folder}\nFile: ${item.file}\nLink: ${item.webUrl}`;
}

function toTitle(item, raw) {
  // First non-empty line up to 100 chars, else folder/file
  const firstLine = (raw || '').replace(/\r/g, '').split('\n').map(s => s.trim()).find(Boolean);
  if (firstLine) return firstLine.substring(0, 100);
  return `${item.folder} — ${item.file}`;
}

async function main() {
  if (!fs.existsSync(INDEX_FILE)) {
    console.error(`Not found: ${INDEX_FILE}. Run npm run fetch:repo first.`);
    process.exit(1);
  }
  const indexText = fs.readFileSync(INDEX_FILE, 'utf8').replace(/^\uFEFF/, '');
  const index = JSON.parse(indexText);
  const items = Array.isArray(index.items) ? index.items : [];
  let filtered = items;
  if (INCLUDE_FOLDERS.length) {
    const set = new Set(INCLUDE_FOLDERS.map(x => x.toLowerCase()));
    filtered = filtered.filter(it => set.has(String(it.folder || '').toLowerCase()));
  }
  if (EXCLUDE_FOLDERS.length) {
    const set = new Set(EXCLUDE_FOLDERS.map(x => x.toLowerCase()));
    filtered = filtered.filter(it => !set.has(String(it.folder || '').toLowerCase()));
  }
  const selected = typeof LIMIT === 'number' ? filtered.slice(0, LIMIT) : filtered;

  const outputs = [];
  for (const it of selected) {
    try {
      const raw = await tryFetch(it.rawUrl);
      if (!raw) continue;
      const clean = stripAtMentions(raw.trim());
      if (!clean) continue;
      const attribution = buildAttribution(it);
      const title = toTitle(it, clean);
      const content = `${clean}\n\n---\n${attribution}`;
      const tags = [ 'Imported', 'External', it.folder ].filter(Boolean);
      outputs.push({
        title,
        content,
        priceSol: DEFAULT_PRICE,
        category: CATEGORY,
        filters: tags,
        owner: IMPORT_OWNER,
      });
    } catch {
      // ignore
    }
  }

  await fs.promises.mkdir(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(outputs, null, 2), 'utf8');
  console.log(`Saved ${outputs.length} prompts -> ${path.relative(ROOT, OUT_FILE)}`);

  if (SEED_SECRET) {
    const payload = {
      category: CATEGORY,
      replace: false,
      defaultPrice: DEFAULT_PRICE,
      prompts: outputs.map(p => ({
        title: p.title,
        content: p.content,
        priceSol: p.priceSol,
        tags: p.filters,
        category: p.category,
        owner: p.owner
      }))
    };
    const r = await postJSON(ADMIN_URL, payload, { 'x-seed-secret': SEED_SECRET });
    if (r.ok) {
      console.log(`Seeded via admin API: ${ADMIN_URL} -> ${r.status}`);
      return;
    }
    console.warn(`Admin seed failed (${r.status}): ${r.text}`);
  }

  // Fallback: per-item POST to /api/prompts (no secret required)
  const API_URL = process.env.IMPORT_API_URL || 'http://localhost:3000/api/prompts';
  let ok = 0;
  for (const it of outputs) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-owner': IMPORT_OWNER },
        body: JSON.stringify({
          title: it.title,
          content: it.content,
          priceSol: it.priceSol,
          category: it.category,
          filters: it.filters
        })
      });
      if (res.ok) ok++;
    } catch {
      // ignore
    }
  }
  if (ok) {
    console.log(`Posted ${ok}/${outputs.length} prompts to ${API_URL}`);
  } else {
    console.log('No prompts posted (server down or endpoint unavailable). JSON export completed.');
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
