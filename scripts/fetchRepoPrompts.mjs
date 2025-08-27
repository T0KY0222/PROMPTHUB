#!/usr/bin/env node
/**
 * Fetch an index of prompt files from https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools
 * Outputs JSON to stdout and optionally downloads raw files under ./external-prompts/
 *
 * Usage (PowerShell):
 *   node scripts/fetchRepoPrompts.mjs                 # list index only
 *   node scripts/fetchRepoPrompts.mjs --fetch-excerpts # include short excerpts
 *   node scripts/fetchRepoPrompts.mjs --download       # also download raw files
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = 'https://raw.githubusercontent.com/x1xhlol/system-prompts-and-models-of-ai-tools/main';

const FOLDERS = [
  'VSCode Agent',
  'Cursor Prompts',
  'Devin AI',
  'Replit',
  'Windsurf',
  'v0 Prompts and Tools',
  'Open Source prompts',
  'Perplexity',
  'Trae',
  'Lovable',
  'Xcode',
  'Junie',
  'Kiro',
  'Warp.dev',
  'Z.ai Code',
  'dia',
  'Orchids.app',
  'Cluely',
  'Same.dev'
];

const CANDIDATE_FILES = [
  'Prompt.txt',
  'System Prompt.txt',
  'Agent Prompt.txt',
  'Agent CLI Prompt 2025-08-07.txt',
  'Tools Wave 11.txt',
  'Decision-making prompt.txt',
  'Enterprise Prompt.txt',
  'README.md'
];

const args = new Set(process.argv.slice(2));
const WANT_EXCERPTS = args.has('--fetch-excerpts');
const WANT_DOWNLOAD = args.has('--download');

const outDir = path.resolve(__dirname, '..', 'external-prompts');

function toRawUrl(folder, file) {
  const encFolder = folder.split('/').map(encodeURIComponent).join('/');
  const encFile = file.split('/').map(encodeURIComponent).join('/');
  return `${ROOT}/${encFolder}/${encFile}`;
}

async function tryFetch(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) return null;
  const text = await res.text();
  return text;
}

function safeExcerpt(text, max = 400) {
  if (!text) return '';
  const cleaned = text.replace(/\r/g, '').trim();
  if (cleaned.length <= max) return cleaned;
  return cleaned.slice(0, max) + '…';
}

async function ensureDir(p) {
  await fs.promises.mkdir(p, { recursive: true });
}

async function downloadIfNeeded(folder, file, content) {
  if (!WANT_DOWNLOAD || !content) return;
  const target = path.join(outDir, folder, file);
  await ensureDir(path.dirname(target));
  await fs.promises.writeFile(target, content, 'utf8');
}

async function main() {
  const results = [];

  for (const folder of FOLDERS) {
    for (const candidate of CANDIDATE_FILES) {
      const url = toRawUrl(folder, candidate);
      try {
        const text = await tryFetch(url);
        if (text) {
          const item = {
            folder,
            file: candidate,
            rawUrl: url,
            webUrl: `https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools/blob/main/${encodeURIComponent(folder)}/${encodeURIComponent(candidate)}`
          };
          if (WANT_EXCERPTS) item.excerpt = safeExcerpt(text);
          results.push(item);
          await downloadIfNeeded(folder, candidate, text);
        }
      } catch (e) {
        // ignore per-file errors
      }
    }
  }

  // Sort by folder then file for stable output
  results.sort((a, b) => (a.folder + a.file).localeCompare(b.folder + b.file));

  process.stdout.write(JSON.stringify({
    sourceRepo: 'x1xhlol/system-prompts-and-models-of-ai-tools',
    fetchedAt: new Date().toISOString(),
    count: results.length,
    items: results
  }, null, 2));
}

main().catch((err) => {
  console.error('fetchRepoPrompts failed:', err);
  process.exit(1);
});
