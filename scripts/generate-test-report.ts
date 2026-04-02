#!/usr/bin/env node
/**
 * generate-test-report.ts
 *
 * Reads JUnit XML files from reports/ and produces a single reports/index.html
 * combining results from all test suites (unit-be, integration-be, e2e).
 *
 * Handles two JUnit variants:
 *   - Node 22 flat format: <testcase> directly under <testsuites>
 *   - Playwright nested format: <testcase> inside <testsuite> elements
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportsDir = resolve(__dirname, '../reports');
const outFile = resolve(reportsDir, 'index.html');

// ── Types ─────────────────────────────────────────────────────────────────────

interface TestCase {
  name: string;
  time: number;
  status: 'passed' | 'failed' | 'skipped';
  failureMessage?: string;
  classname: string;
}

interface TestGroup {
  name: string;
  cases: TestCase[];
}

interface Suite {
  label: string;
  file: string;
  groups: TestGroup[];
  notRun: boolean;
}

// ── XML helpers ───────────────────────────────────────────────────────────────

function getAttr(tag: string, name: string): string {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? xmlUnescape(m[1]) : '';
}

function xmlUnescape(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function parseTestCase(openTag: string, inner: string): TestCase {
  const name = getAttr(openTag, 'name') || 'unnamed';
  const time = parseFloat(getAttr(openTag, 'time') || '0');
  const classname = getAttr(openTag, 'classname') || '';

  const failureMatch = inner.match(/<failure[^>]*(?:message="([^"]*)")?[^>]*>?([\s\S]*?)<\/failure>/);
  const skipped = /<skipped/.test(inner);

  let status: TestCase['status'] = 'passed';
  let failureMessage: string | undefined;

  if (failureMatch) {
    status = 'failed';
    failureMessage = (failureMatch[1] || failureMatch[2] || '').trim().slice(0, 600);
  } else if (skipped) {
    status = 'skipped';
  }

  return { name, time, status, failureMessage, classname };
}

function parseJUnit(xml: string): TestGroup[] {
  // Playwright format: testcases nested inside <testsuite> elements
  if (/<testsuite[\s>]/.test(xml)) {
    const groups: TestGroup[] = [];

    for (const suiteMatch of xml.matchAll(/<testsuite([^>]*)>([\s\S]*?)<\/testsuite>/g)) {
      const suiteName = getAttr(suiteMatch[1], 'name') || 'suite';
      const suiteInner = suiteMatch[2];
      const cases: TestCase[] = [];

      for (const tcMatch of suiteInner.matchAll(/<testcase([^>]*)>([\s\S]*?)<\/testcase>|<testcase([^>]*?)\/>/g)) {
        const openTag = tcMatch[1] ?? tcMatch[3];
        const inner = tcMatch[2] ?? '';
        cases.push(parseTestCase(openTag, inner));
      }

      if (cases.length > 0) groups.push({ name: suiteName, cases });
    }
    return groups;
  }

  // Node 22 flat format: all <testcase> directly under <testsuites>
  const allCases: TestCase[] = [];

  for (const tcMatch of xml.matchAll(/<testcase([^>]*)>([\s\S]*?)<\/testcase>|<testcase([^>]*?)\/>/g)) {
    const openTag = tcMatch[1] ?? tcMatch[3];
    const inner = tcMatch[2] ?? '';
    allCases.push(parseTestCase(openTag, inner));
  }

  // Group by classname
  const byClass = new Map<string, TestCase[]>();
  for (const tc of allCases) {
    const key = tc.classname || 'tests';
    if (!byClass.has(key)) byClass.set(key, []);
    byClass.get(key)!.push(tc);
  }

  return [...byClass.entries()].map(([name, cases]) => ({ name, cases }));
}

function loadSuite(label: string, file: string): Suite {
  const xmlPath = resolve(reportsDir, file);
  if (!existsSync(xmlPath)) {
    return { label, file, groups: [], notRun: true };
  }
  const xml = readFileSync(xmlPath, 'utf-8');
  const groups = parseJUnit(xml);
  return { label, file, groups, notRun: false };
}

// ── Stats ─────────────────────────────────────────────────────────────────────

interface Stats {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

function suiteStats(suite: Suite): Stats {
  let total = 0, passed = 0, failed = 0, skipped = 0, duration = 0;
  for (const g of suite.groups) {
    for (const tc of g.cases) {
      total++;
      if (tc.status === 'passed') passed++;
      else if (tc.status === 'failed') failed++;
      else skipped++;
      duration += tc.time;
    }
  }
  return { total, passed, failed, skipped, duration };
}

function totalStats(suites: Suite[]): Stats {
  const stats: Stats = { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 };
  for (const s of suites) {
    const ss = suiteStats(s);
    stats.total += ss.total;
    stats.passed += ss.passed;
    stats.failed += ss.failed;
    stats.skipped += ss.skipped;
    stats.duration += ss.duration;
  }
  return stats;
}

// ── HTML generation ───────────────────────────────────────────────────────────

function htmlEsc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function statusBadge(s: Stats): string {
  if (s.total === 0) return `<span class="badge badge-skip">NOT RUN</span>`;
  if (s.failed > 0) return `<span class="badge badge-fail">FAILED</span>`;
  return `<span class="badge badge-pass">PASSED</span>`;
}

function durationStr(seconds: number): string {
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  return `${seconds.toFixed(2)}s`;
}

function renderSuite(suite: Suite, idx: number): string {
  const ss = suiteStats(suite);
  const id = `suite-${idx}`;

  const summaryLine = suite.notRun
    ? `<span class="stat-dim">—</span>`
    : `<span class="stat-pass">${ss.passed} passed</span>${ss.failed ? ` &nbsp; <span class="stat-fail">${ss.failed} failed</span>` : ''}${ss.skipped ? ` &nbsp; <span class="stat-skip">${ss.skipped} skipped</span>` : ''} &nbsp; <span class="stat-dim">${durationStr(ss.duration)}</span>`;

  const notRunHints: Record<string, string> = {
    'integration-be.xml': 'Run <code>npm run test:integration</code> (requires Docker) to populate results.',
    'e2e.xml': 'Run <code>npm run test:e2e</code> (requires Docker) to populate results.',
    'client-unit.xml': 'Run <code>npm run test:report:unit:fe</code> to populate results.',
    'client-browser.xml': 'Run <code>npm run test:report:browser</code> to populate results.',
  };
  const hint = notRunHints[suite.file] ?? 'Run the suite to populate results.';

  const details = suite.notRun
    ? `<p class="not-run-msg">${hint}</p>`
    : suite.groups.map(g => renderGroup(g)).join('');

  return `
  <div class="suite" id="${id}">
    <button class="suite-header" onclick="toggle('${id}')" aria-expanded="false">
      <span class="suite-chevron" id="${id}-chevron">&#9658;</span>
      <span class="suite-label">${htmlEsc(suite.label)}</span>
      ${statusBadge(ss)}
      <span class="suite-summary">${summaryLine}</span>
    </button>
    <div class="suite-body" id="${id}-body" hidden>
      ${details}
    </div>
  </div>`;
}

function renderGroup(g: TestGroup): string {
  const passed = g.cases.filter(c => c.status === 'passed').length;
  const failed = g.cases.filter(c => c.status === 'failed').length;
  const skipped = g.cases.filter(c => c.status === 'skipped').length;

  const rows = g.cases.map(tc => {
    const icon = tc.status === 'passed' ? '&#10003;' : tc.status === 'failed' ? '&#10007;' : '&#9675;';
    const cls = `tc-${tc.status}`;
    const failure = tc.failureMessage
      ? `<pre class="failure-pre">${htmlEsc(tc.failureMessage)}</pre>`
      : '';
    return `<li class="tc ${cls}"><span class="tc-icon">${icon}</span> <span class="tc-name">${htmlEsc(tc.name)}</span> <span class="tc-time">${durationStr(tc.time)}</span>${failure}</li>`;
  }).join('');

  return `
  <div class="group">
    <div class="group-header">
      <span class="group-name">${htmlEsc(g.name)}</span>
      <span class="group-stats">
        ${passed > 0 ? `<span class="stat-pass">${passed}&#10003;</span>` : ''}
        ${failed > 0 ? `<span class="stat-fail">${failed}&#10007;</span>` : ''}
        ${skipped > 0 ? `<span class="stat-skip">${skipped}&#9675;</span>` : ''}
      </span>
    </div>
    <ul class="tc-list">${rows}</ul>
  </div>`;
}

function renderLinks(): string {
  const pwReport = existsSync(resolve(__dirname, '../tests/e2e/playwright-report/index.html'));
  const c8Report = existsSync(resolve(__dirname, '../coverage/index.html'));

  if (!pwReport && !c8Report) return '';

  const links: string[] = [];
  if (pwReport) links.push(`<a class="ext-link" href="../tests/e2e/playwright-report/index.html">Playwright Report &#8599;</a>`);
  if (c8Report) links.push(`<a class="ext-link" href="../coverage/index.html">Coverage Report &#8599;</a>`);

  return `<div class="ext-links">${links.join('')}</div>`;
}

function generateHtml(suites: Suite[]): string {
  const ts = totalStats(suites);
  const overallBadge = ts.total === 0
    ? `<span class="badge badge-skip">NO RESULTS</span>`
    : ts.failed > 0
      ? `<span class="badge badge-fail">&#10007; ${ts.failed} FAILING</span>`
      : `<span class="badge badge-pass">&#10003; ALL PASSING</span>`;

  const now = new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>SCVM GRINDER &mdash; Test Report</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0d0d0d;
    --bg2: #161616;
    --bg3: #1e1e1e;
    --border: #2a2a2a;
    --pass: #5dfc8b;
    --fail: #ff4545;
    --skip: #888;
    --accent: #f0e040;
    --text: #e0e0e0;
    --dim: #666;
    --code: #b8a9f8;
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Courier New', Courier, monospace;
    font-size: 14px;
    line-height: 1.5;
    padding: 2rem;
    max-width: 1100px;
    margin: 0 auto;
  }

  h1 {
    font-size: 2rem;
    font-weight: 900;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--accent);
    border-bottom: 3px solid var(--accent);
    padding-bottom: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .subtitle { color: var(--dim); font-size: 0.8rem; margin-bottom: 2rem; }

  .summary {
    display: flex;
    gap: 1.5rem;
    align-items: center;
    background: var(--bg2);
    border: 1px solid var(--border);
    padding: 1rem 1.5rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
  }

  .summary-overall { font-size: 1.1rem; font-weight: 700; }
  .summary-stat { display: flex; flex-direction: column; align-items: center; gap: 0.1rem; }
  .summary-stat .num { font-size: 1.8rem; font-weight: 900; line-height: 1; }
  .summary-stat .lbl { font-size: 0.7rem; text-transform: uppercase; color: var(--dim); }
  .num-pass { color: var(--pass); }
  .num-fail { color: var(--fail); }
  .num-skip { color: var(--skip); }
  .num-total { color: var(--text); }
  .summary-sep { width: 1px; height: 3rem; background: var(--border); }

  .badge {
    display: inline-block;
    padding: 0.15rem 0.5rem;
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-radius: 2px;
  }
  .badge-pass { background: var(--pass); color: #000; }
  .badge-fail { background: var(--fail); color: #fff; }
  .badge-skip { background: var(--bg3); color: var(--dim); border: 1px solid var(--border); }

  .suites { display: flex; flex-direction: column; gap: 0.5rem; }
  .suite { border: 1px solid var(--border); }

  .suite-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1rem;
    background: var(--bg2);
    border: none;
    color: var(--text);
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    font-size: 0.95rem;
    flex-wrap: wrap;
  }

  .suite-header:hover { background: var(--bg3); }
  .suite-chevron { color: var(--dim); font-size: 0.7rem; transition: transform 0.15s; display: inline-block; }
  .suite-chevron.open { transform: rotate(90deg); }
  .suite-label { font-weight: 700; font-size: 1rem; letter-spacing: 0.05em; }
  .suite-summary { margin-left: auto; font-size: 0.82rem; }

  .suite-body { padding: 0; background: var(--bg); }

  .group { border-top: 1px solid var(--border); }

  .group-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1.25rem;
    background: var(--bg3);
    font-size: 0.8rem;
  }

  .group-name { color: var(--dim); flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .group-stats { display: flex; gap: 0.5rem; flex-shrink: 0; }

  .tc-list { list-style: none; padding: 0; }

  .tc {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    padding: 0.3rem 1.5rem;
    border-top: 1px solid var(--border);
    font-size: 0.85rem;
    flex-wrap: wrap;
  }

  .tc:hover { background: var(--bg2); }
  .tc-icon { flex-shrink: 0; font-weight: 700; }
  .tc-passed .tc-icon { color: var(--pass); }
  .tc-failed .tc-icon { color: var(--fail); }
  .tc-skipped .tc-icon { color: var(--skip); }
  .tc-name { flex: 1; }
  .tc-time { color: var(--dim); font-size: 0.75rem; flex-shrink: 0; }

  .failure-pre {
    flex-basis: 100%;
    margin-top: 0.4rem;
    padding: 0.5rem;
    background: #1a0808;
    border-left: 3px solid var(--fail);
    font-size: 0.75rem;
    color: #ff9999;
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 200px;
    overflow-y: auto;
  }

  .stat-pass { color: var(--pass); }
  .stat-fail { color: var(--fail); }
  .stat-skip { color: var(--skip); }
  .stat-dim  { color: var(--dim); }

  .not-run-msg {
    padding: 1rem 1.5rem;
    color: var(--dim);
    font-size: 0.85rem;
  }
  .not-run-msg code { color: var(--code); }

  .ext-links { display: flex; gap: 1rem; margin-top: 2rem; }
  .ext-link {
    color: var(--accent);
    text-decoration: none;
    font-size: 0.85rem;
    border-bottom: 1px solid transparent;
  }
  .ext-link:hover { border-color: var(--accent); }

  footer { margin-top: 3rem; color: var(--dim); font-size: 0.75rem; border-top: 1px solid var(--border); padding-top: 1rem; }
</style>
</head>
<body>
<h1>SCVM GRINDER</h1>
<p class="subtitle">Test Report &nbsp;&middot;&nbsp; Generated ${htmlEsc(now)}</p>

<div class="summary">
  <div class="summary-overall">${overallBadge}</div>
  <div class="summary-sep"></div>
  <div class="summary-stat"><span class="num num-total">${ts.total}</span><span class="lbl">Total</span></div>
  <div class="summary-stat"><span class="num num-pass">${ts.passed}</span><span class="lbl">Passed</span></div>
  <div class="summary-stat"><span class="num num-fail">${ts.failed}</span><span class="lbl">Failed</span></div>
  <div class="summary-stat"><span class="num num-skip">${ts.skipped}</span><span class="lbl">Skipped</span></div>
  <div class="summary-sep"></div>
  <div class="summary-stat"><span class="num num-total" style="font-size:1.2rem">${durationStr(ts.duration)}</span><span class="lbl">Duration</span></div>
</div>

<div class="suites">
${suites.map((s, i) => renderSuite(s, i)).join('\n')}
</div>

${renderLinks()}

<footer>
  <p>SCVM GRINDER &middot; Node ${process.version} &middot; ${htmlEsc(now)}</p>
</footer>

<script>
  function toggle(id) {
    const body = document.getElementById(id + '-body');
    const chevron = document.getElementById(id + '-chevron');
    const btn = body.previousElementSibling;
    const isHidden = body.hidden;
    body.hidden = !isHidden;
    chevron.classList.toggle('open', isHidden);
    btn.setAttribute('aria-expanded', String(isHidden));
  }

  // Auto-expand suites with failures
  document.querySelectorAll('.suite').forEach(function(suite) {
    if (suite.querySelector('.badge-fail') || suite.querySelector('.tc-failed')) {
      toggle(suite.id);
    }
  });
</script>
</body>
</html>`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

const suites: Suite[] = [
  loadSuite('Unit Tests (Backend)', 'unit-be.xml'),
  loadSuite('Integration Tests (Backend)', 'integration-be.xml'),
  loadSuite('E2E Tests (Playwright)', 'e2e.xml'),
  loadSuite('Unit Tests (Frontend)', 'client-unit.xml'),
  loadSuite('Browser Tests (Frontend)', 'client-browser.xml'),
];

const html = generateHtml(suites);
writeFileSync(outFile, html, 'utf-8');

const ts = totalStats(suites);
const runSuites = suites.filter(s => !s.notRun);
console.log(`\nTest report written to: ${outFile}`);
console.log(`Suites: ${runSuites.length}/${suites.length} run`);
console.log(`Results: ${ts.passed} passed, ${ts.failed} failed, ${ts.skipped} skipped (${durationStr(ts.duration)})`);
if (ts.failed > 0) process.exit(1);
