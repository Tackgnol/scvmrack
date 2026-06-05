#!/usr/bin/env node
/**
 * test-corpus-parity.ts
 *
 * Fetches each character from the golden corpus via the live backend and
 * compares the response (after the same normalization) against the stored baseline.
 *
 * Usage: node --import tsx backend/scripts/test-corpus-parity.ts
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

interface CorpusEntry {
  classId: number | null;
  en: unknown;
  pl: unknown;
}

interface GoldenCorpus {
  meta: { captured_at: string; base_url: string };
  characters: CorpusEntry[];
}

function normalize(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(normalize);
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (k === 'id' && typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v)) {
      result[k] = '<uuid>';
    } else if (
      (k === 'created_at' || k === 'updated_at' || k === 'createdAt' || k === 'updatedAt') &&
      typeof v === 'string'
    ) {
      result[k] = '<timestamp>';
    } else {
      result[k] = normalize(v);
    }
  }
  return result;
}

class CookieJar {
  readonly cookies = new Map<string, string>();
  capture(res: Response): void {
    const setCookies =
      typeof (res.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie === 'function'
        ? (res.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
        : [];
    if (!setCookies.length) { const s = res.headers.get('set-cookie'); if (s) setCookies.push(s); }
    for (const raw of setCookies) {
      const chunk = raw.split(';')[0];
      const sep = chunk.indexOf('=');
      if (sep <= 0) continue;
      this.cookies.set(chunk.slice(0, sep).trim(), chunk.slice(sep + 1).trim());
    }
  }
  header(): string { return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; '); }
}

async function req(path: string, opts: { method?: string; json?: unknown; headers?: Record<string, string>; jar?: CookieJar } = {}) {
  const { method = 'GET', json, headers = {}, jar } = opts;
  const h: Record<string, string> = { ...headers };
  if (jar) { const c = jar.header(); if (c) h.cookie = c; }
  let body: string | undefined;
  if (json !== undefined) { h['content-type'] = 'application/json'; body = JSON.stringify(json); }
  const res = await fetch(`${BASE_URL}${path}`, { method, headers: h, body });
  if (jar) jar.capture(res);
  return res;
}

async function signIn(): Promise<CookieJar> {
  const jar = new CookieJar();
  const r = await req('/api/auth/sign-in/anonymous', { method: 'POST', json: {}, jar });
  if (!r.ok) throw new Error(`sign-in failed: ${r.status}`);
  return jar;
}

async function csrf(jar: CookieJar): Promise<string> {
  const r = await req('/api/csrf-token', { jar });
  const { token } = await r.json() as { token?: string };
  if (!token) throw new Error('no csrf token');
  return token;
}

async function createCharacter(jar: CookieJar, classId?: number): Promise<string> {
  const token = await csrf(jar);
  const body: Record<string, unknown> = {};
  if (classId !== undefined) body.classId = classId;
  const r = await req('/api/characters/new', { method: 'POST', json: body, headers: { 'x-csrf-token': token }, jar });
  if (!r.ok) throw new Error(`create failed ${r.status}: ${await r.text()}`);
  const { id } = await r.json() as { id?: string };
  if (!id) throw new Error('no id');
  return id;
}

async function fetchCharacter(jar: CookieJar, id: string, locale: string): Promise<unknown> {
  const r = await req(`/api/characters/${id}?locale=${locale}`, { jar });
  if (!r.ok) throw new Error(`fetch failed ${r.status}`);
  return r.json();
}

function diff(expected: unknown, actual: unknown, path = ''): string[] {
  const errors: string[] = [];
  if (JSON.stringify(expected) === JSON.stringify(actual)) return errors;

  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) {
      errors.push(`${path}: array length expected=${expected.length} actual=${actual.length}`);
    }
    const len = Math.min(expected.length, actual.length);
    for (let i = 0; i < len; i++) {
      errors.push(...diff(expected[i], actual[i], `${path}[${i}]`));
    }
    return errors;
  }

  if (typeof expected === 'object' && expected !== null && typeof actual === 'object' && actual !== null && !Array.isArray(expected) && !Array.isArray(actual)) {
    const expObj = expected as Record<string, unknown>;
    const actObj = actual as Record<string, unknown>;
    const allKeys = new Set([...Object.keys(expObj), ...Object.keys(actObj)]);
    for (const k of allKeys) {
      if (!(k in expObj)) {
        errors.push(`${path}.${k}: extra key in actual (value=${JSON.stringify(actObj[k])})`);
      } else if (!(k in actObj)) {
        errors.push(`${path}.${k}: missing key in actual (expected=${JSON.stringify(expObj[k])})`);
      } else {
        errors.push(...diff(expObj[k], actObj[k], `${path}.${k}`));
      }
    }
    return errors;
  }

  errors.push(`${path}: expected=${JSON.stringify(expected)} actual=${JSON.stringify(actual)}`);
  return errors;
}

async function createCharacterWithRateLimit(jar: CookieJar, classId: number | undefined): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const token = await csrf(jar);
    const body: Record<string, unknown> = {};
    if (classId !== undefined) body.classId = classId;
    const r = await req('/api/characters/new', { method: 'POST', json: body, headers: { 'x-csrf-token': token }, jar });
    if (r.ok) {
      const { id } = await r.json() as { id?: string };
      if (!id) throw new Error('no id');
      return id;
    }
    if (r.status === 429) {
      const body = await r.json() as { error: string };
      const match = body.error?.match(/retry in (\d+) second/);
      const waitSec = match ? parseInt(match[1], 10) + 2 : 62;
      console.log(`  Rate limit — waiting ${waitSec}s …`);
      await new Promise(res => setTimeout(res, waitSec * 1000));
      continue;
    }
    throw new Error(`create failed ${r.status}: ${await r.text()}`);
  }
  throw new Error('create failed after 3 attempts');
}

async function main() {
  const corpusPath = join(__dirname, '..', 'tests', 'fixtures', 'golden-corpus.json');
  const corpus = JSON.parse(readFileSync(corpusPath, 'utf8')) as GoldenCorpus;

  console.log(`Parity test against golden corpus (${corpus.characters.length} entries) …\n`);

  // Pre-create all characters (rate-limit resilient) before comparing
  const created: Array<{ jar: CookieJar; id: string; entry: CorpusEntry }> = [];
  for (const entry of corpus.characters) {
    const jar = await signIn();
    const id = await createCharacterWithRateLimit(jar, entry.classId ?? undefined);
    created.push({ jar, id, entry });
  }

  let pass = 0;
  let fail = 0;

  for (const { jar, id, entry } of created) {
    const label = entry.classId === null ? 'random' : `classId=${entry.classId}`;

    for (const locale of ['en', 'pl'] as const) {
      const raw = await fetchCharacter(jar, id, locale);
      const actual = normalize(raw);
      const expected = entry[locale];
      const diffs = diff(expected, actual);

      if (diffs.length === 0) {
        console.log(`  ✓ ${label} [${locale}]`);
        pass++;
      } else {
        console.error(`  ✗ ${label} [${locale}]`);
        for (const d of diffs.slice(0, 10)) {
          console.error(`      ${d}`);
        }
        if (diffs.length > 10) console.error(`      … and ${diffs.length - 10} more`);
        fail++;
      }
    }
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
