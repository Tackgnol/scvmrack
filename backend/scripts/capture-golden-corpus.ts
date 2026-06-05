#!/usr/bin/env node
/**
 * capture-golden-corpus.ts
 *
 * Hits a running backend, generates one character per class (classIds 1–6),
 * fetches each character in both locales (en + pl), and saves the responses
 * as JSON fixtures. Also captures one character with no classId (random class).
 *
 * The output is used as the parity baseline for Phase 4: when the TypeScript
 * port of `get_character_full` and `generate_character` is complete, its
 * output must match this corpus.
 *
 * Usage: node --import tsx backend/scripts/capture-golden-corpus.ts
 * Env:   E2E_BASE_URL  — backend base URL (default: http://localhost:3000)
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';

// ── Normalisation ─────────────────────────────────────────────────────────────

function normalize(obj: unknown): unknown {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(normalize);
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (k === 'id' && typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v)) {
      result[k] = '<uuid>';
    } else if ((k === 'created_at' || k === 'updated_at' || k === 'createdAt' || k === 'updatedAt') && typeof v === 'string') {
      result[k] = '<timestamp>';
    } else {
      result[k] = normalize(v);
    }
  }
  return result;
}

// ── Cookie jar ────────────────────────────────────────────────────────────────

class CookieJar {
  readonly cookies = new Map<string, string>();

  capture(response: Response): void {
    const setCookies =
      typeof (response.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie ===
      'function'
        ? (response.headers as Headers & { getSetCookie: () => string[] }).getSetCookie()
        : [];

    if (setCookies.length === 0) {
      const single = response.headers.get('set-cookie');
      if (single) setCookies.push(single);
    }

    for (const rawCookie of setCookies) {
      const firstChunk = rawCookie.split(';')[0];
      const separator = firstChunk.indexOf('=');
      if (separator <= 0) continue;
      const key = firstChunk.slice(0, separator).trim();
      const value = firstChunk.slice(separator + 1).trim();
      if (!key || !value) continue;
      this.cookies.set(key, value);
    }
  }

  header(): string {
    return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
  }
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────

async function apiRequest(
  path: string,
  options: {
    method?: string;
    json?: unknown;
    headers?: Record<string, string>;
    jar?: CookieJar;
  } = {}
): Promise<Response> {
  const { method = 'GET', json, headers = {}, jar } = options;

  const requestHeaders: Record<string, string> = { ...headers };
  if (jar) {
    const cookieHeader = jar.header();
    if (cookieHeader) requestHeaders.cookie = cookieHeader;
  }

  let body: string | undefined;
  if (json !== undefined) {
    requestHeaders['content-type'] = 'application/json';
    body = JSON.stringify(json);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: requestHeaders,
    body,
  });

  if (jar) jar.capture(response);
  return response;
}

async function signInAnonymous(): Promise<CookieJar> {
  const jar = new CookieJar();
  const response = await apiRequest('/api/auth/sign-in/anonymous', {
    method: 'POST',
    json: {},
    jar,
  });

  if (!response.ok) {
    throw new Error(
      `Anonymous sign-in failed: ${response.status} ${await response.text()}`
    );
  }

  return jar;
}

async function fetchCsrfToken(jar: CookieJar): Promise<string> {
  const response = await apiRequest('/api/csrf-token', { jar });

  if (!response.ok) {
    throw new Error(`CSRF token fetch failed: ${response.status} ${await response.text()}`);
  }

  const { token } = (await response.json()) as { token?: string };
  if (!token) {
    throw new Error('CSRF endpoint returned no token');
  }

  return token;
}

async function createCharacter(
  jar: CookieJar,
  classId?: number
): Promise<string> {
  const csrfToken = await fetchCsrfToken(jar);
  const body: Record<string, unknown> = {};
  if (classId !== undefined) {
    body.classId = classId;
  }

  const response = await apiRequest('/api/characters/new', {
    method: 'POST',
    json: body,
    headers: { 'x-csrf-token': csrfToken },
    jar,
  });

  if (!response.ok) {
    throw new Error(
      `Character creation failed (classId=${classId ?? 'random'}): ${response.status} ${await response.text()}`
    );
  }

  const { id } = (await response.json()) as { id?: string };
  if (!id) {
    throw new Error('Character creation returned no id');
  }

  return id;
}

async function fetchCharacter(
  jar: CookieJar,
  id: string,
  locale: 'en' | 'pl'
): Promise<unknown> {
  const response = await apiRequest(`/api/characters/${id}?locale=${locale}`, { jar });

  if (!response.ok) {
    throw new Error(
      `Fetch character ${id} (${locale}) failed: ${response.status} ${await response.text()}`
    );
  }

  return response.json();
}

// ── Entry point ───────────────────────────────────────────────────────────────

interface CorpusEntry {
  classId: number | null;
  en: unknown;
  pl: unknown;
}

interface GoldenCorpus {
  meta: {
    captured_at: string;
    base_url: string;
    note: string;
  };
  characters: CorpusEntry[];
}

async function main(): Promise<void> {
  console.log(`Capturing golden corpus from ${BASE_URL} …`);

  const outputDir = join(__dirname, '..', 'tests', 'fixtures');
  mkdirSync(outputDir, { recursive: true });
  const outputPath = join(outputDir, 'golden-corpus.json');

  // Load existing corpus to resume interrupted captures
  let existingCharacters: CorpusEntry[] = [];
  try {
    const { readFileSync: rfs } = await import('node:fs');
    const existing = JSON.parse(rfs(outputPath, 'utf8')) as GoldenCorpus;
    existingCharacters = existing.characters ?? [];
    console.log(`  Resuming: ${existingCharacters.length} entries already captured.`);
  } catch {
    // No existing corpus — start fresh
  }
  const capturedClassIds = new Set(existingCharacters.map((e) => e.classId));

  const characters: CorpusEntry[] = [...existingCharacters];

  // classIds 1–6 + null (random)
  const classIdSlots: Array<number | null> = [1, 2, 3, 4, 5, 6, null];

  for (const classId of classIdSlots) {
    const label = classId === null ? 'random (no classId)' : `classId=${classId}`;

    if (capturedClassIds.has(classId)) {
      console.log(`  Skipping ${label} (already captured)`);
      continue;
    }
    console.log(`  Generating character: ${label} …`);

    try {
      // Each character gets its own session so they don't interfere
      const jar = await signInAnonymous();
      const id = await createCharacter(jar, classId ?? undefined);

      const [rawEn, rawPl] = await Promise.all([
        fetchCharacter(jar, id, 'en'),
        fetchCharacter(jar, id, 'pl'),
      ]);

      characters.push({
        classId,
        en: normalize(rawEn),
        pl: normalize(rawPl),
      });

      console.log(`    ✓ captured (${label})`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`    ✗ skipped (${label}): ${message}`);
    }
  }

  const corpus: GoldenCorpus = {
    meta: {
      captured_at: new Date().toISOString(),
      base_url: BASE_URL,
      note: 'Captured from SQL implementation. Used as parity baseline for Phase 4 hydration port.',
    },
    characters,
  };

  writeFileSync(outputPath, JSON.stringify(corpus, null, 2), 'utf8');
  console.log(`\nCorpus written to: ${outputPath}`);
  console.log(`  ${characters.length} of ${classIdSlots.length} entries captured.`);
}

main().catch((err) => {
  console.error('Fatal error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
