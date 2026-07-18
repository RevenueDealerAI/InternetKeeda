// ============================================================================
// AUTOMATED SEO RESEARCH BOT — single build file for the single n8n workflow.
//
// Everything lives HERE: config defaults, the digest prompt, every node's
// code, structural validation, and the self-tests. Running this file builds
// workflow.json (the file bundled into the store zip) — and refuses to write
// it if any test fails.
//
//   Run: node build-workflow.js
//
// Workflow (12 functional nodes): weekly schedule / manual trigger -> Config
// (the only node the buyer edits) -> split the configured feed list -> one
// RSS-read node fetches every feed (a dead feed is skipped, not fatal) ->
// recency window + staticData dedup -> fetch each article's HTML (15s timeout,
// no retry, continue-on-fail so one slow page can't hang the run) -> combine
// all article text into ONE research blob -> ONE Claude call writes a sourced
// briefing -> Gmail sends it -> dedup keys recorded only AFTER the email sends.
//
// Credentials needed after import: Anthropic (anthropicApi) + Gmail (OAuth2).
// Both ship as REPLACE_WITH_* placeholders — no real values in this file or
// in the generated JSON, ever.
// ============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'workflow.json');

// ============================================================================
// DIGEST PROMPT — verbatim. The Build Digest node appends the focus area,
// today's date, and the research blob AFTER this text.
// ============================================================================
const DIGEST_PROMPT = "You are an expert SEO analyst who writes a weekly research briefing for a busy website owner. You are given this week's new articles from authoritative SEO sources (Google Search Central and reputable SEO news), each tagged with source + date + URL.\n\nWrite a clean plain-text email briefing with exactly these sections:\n\nHEADLINE FINDINGS\nThe most important developments of the week (3-8 items). For each: a one-line headline, then 2-3 sentences on what happened and what the reader should do about it, then the source URL on its own line.\n\nWHAT CHANGED / WHY IT MATTERS\nA short closing section (4-8 sentences) connecting the week's items: what actually changed in how Google crawls, indexes, or ranks, what is probably noise, and the single action most worth taking this week.\n\nHard rules:\n- Every finding must be supported by one of the provided articles and cited with its URL. Never invent news or URLs.\n- Weight official Google statements (Search Central blog, named Googlers, official docs) above third-party speculation — and say which is which.\n- Be specific and opinionated; no filler, no generic SEO advice the reader has heard a hundred times.\n- If the week's articles contain nothing significant, say exactly that in two or three honest sentences instead of padding.\n- Plain text only: no markdown headers, asterisks, or code fences — this goes straight into an email body.";

// ============================================================================
// NODE CODE (jsCode strings — no backticks / ${ } inside)
// ============================================================================

const cfgCode = [
  '// ======================= BUYER CONFIG — EDIT ME =======================',
  '// This Code node is the ONLY node you need to edit after import.',
  '// Fill in the values below, save, and activate the workflow.',
  '',
  'return [{ json: {',
  '  // Where your weekly briefing is sent. CHANGE THIS to your inbox.',
  '  DIGEST_EMAIL_TO: "your-email@example.com",',
  '',
  '  // What the briefing should focus on. Steers the analysis, not the feeds.',
  '  // Examples: "technical SEO + indexing", "local SEO", "e-commerce SEO".',
  '  SEO_FOCUS: "technical SEO + indexing",',
  '',
  '  // RSS feeds to research. Free + keyless. Add or remove lines as you',
  '  // like — a feed that is down is skipped without breaking the run.',
  '  SOURCE_FEEDS: [',
  '    "https://feeds.feedburner.com/blogspot/amDG",           // Google Search Central Blog (official)',
  '    "https://feeds.feedburner.com/SearchEngineRoundtable1", // Search Engine Roundtable',
  '    "https://searchengineland.com/feed"                     // Search Engine Land',
  '  ],',
  '',
  '  // Only articles published within this many days are considered.',
  '  RECENCY_WINDOW_DAYS: 14,',
  '',
  '  // Claude model for the one weekly call. sonnet = smart and cheap.',
  '  // See the README for how to pick a different model.',
  '  ANTHROPIC_MODEL: "claude-sonnet-4-6",',
  '  DIGEST_MAX_TOKENS: 4000,',
  '',
  '  // Internals — fine at their defaults.',
  '  MAX_RAW_TEXT_CHARS: 30000,  // per-article cap fed to Claude',
  '  HISTORY_CAP: 500            // how many processed-article keys to remember',
  '} }];',
].join('\n');

const splitFeedsCode = [
  '// One item per configured feed URL — feeds the single RSS-read node,',
  '// which runs once per item. Add feeds in Config, not here.',
  'const cfg = $(\'Config\').first().json;',
  'return cfg.SOURCE_FEEDS.map(function (u) { return { json: { feed_url: u } }; });',
].join('\n');

const filterCode = [
  '// Normalize every feed item to one schema, keep the last RECENCY_WINDOW_DAYS,',
  '// drop items already processed (staticData) and in-run duplicates.',
  '// Zero new items -> return [] -> the run ends quietly (no email, no spend).',
  '// NOTE: staticData persists on PRODUCTION executions only, not manual tests.',
  'const cfg = $(\'Config\').first().json;',
  'const cutoff = Date.now() - cfg.RECENCY_WINDOW_DAYS * 24 * 60 * 60 * 1000;',
  'const sd = $getWorkflowStaticData(\'global\');',
  'const seen = sd.processedKeys || [];',
  'const seenThisRun = {};',
  'const out = [];',
  'for (const item of items) {',
  '  const j = item.json;',
  '  if (!j || j.error || !j.link) continue;',
  '  // Some aggregator feeds (e.g. Bing News RSS) wrap links in apiclick',
  '  // redirects with the real publisher URL in url= — unwrap those.',
  '  let url = j.link;',
  '  const m = /bing\\.com\\/news\\/apiclick[^\\s]*[?&]url=([^&]+)/.exec(url);',
  '  if (m) {',
  '    try { url = decodeURIComponent(m[1]); } catch (e) { continue; }',
  '  }',
  '  if (!/^https?:\\/\\//i.test(url)) continue;',
  '  let source = \'\';',
  '  try { source = new URL(url).hostname.replace(/^www\\./, \'\'); } catch (e) { continue; }',
  '  const published = j.isoDate || (j.pubDate ? new Date(j.pubDate).toISOString() : null);',
  '  const t = new Date(published).getTime();',
  '  if (isNaN(t) || t < cutoff) continue;',
  '  const key = url + \'|\' + published;',
  '  if (seen.indexOf(key) !== -1) continue;',
  '  if (seenThisRun[url]) continue;',
  '  seenThisRun[url] = true;',
  '  out.push({ json: {',
  '    dedup_key: key,',
  '    source_name: source,',
  '    url: url,',
  '    title: j.title,',
  '    published_date: published,',
  '    teaser: String(j.contentSnippet || j.content || \'\').trim()',
  '  } });',
  '}',
  'console.log(\'Filter: \' + items.length + \' in, \' + out.length + \' new within \' + cfg.RECENCY_WINDOW_DAYS + \' days (history: \' + seen.length + \')\');',
  'return out; // [] = nothing new, run ends quietly',
].join('\n');

const buildDigestCode = [
  '// Extract each article\'s readable text and combine EVERYTHING into one',
  '// research blob, then build the single Claude digest request.',
  'const cfg = $(\'Config\').first().json;',
  'const srcItems = $(\'Filter New Items\').all();',
  'const today = new Date().toISOString().slice(0, 10);',
  '',
  'function strip(slice) {',
  '  return slice',
  '    .replace(/<script[\\s\\S]*?<\\/script>/gi, \' \').replace(/<style[\\s\\S]*?<\\/style>/gi, \' \')',
  '    .replace(/<[^>]+>/g, \' \')',
  '    .replace(/&nbsp;/g, \' \').replace(/&amp;/g, \'&\').replace(/&lt;/g, \'<\').replace(/&gt;/g, \'>\')',
  '    .replace(/&quot;/g, String.fromCharCode(34)).replace(/&#39;/g, String.fromCharCode(39))',
  '    .replace(/&mdash;/g, \'\\u2014\').replace(/&ndash;/g, \'\\u2013\')',
  '    .replace(/\\s+/g, \' \').trim();',
  '}',
  'function extractBody(html) {',
  '  if (typeof html !== \'string\' || !html) return \'\';',
  '  const idx = html.indexOf(\'devsite-article-body\'); // Google blog layout',
  '  if (idx !== -1) {',
  '    const end = html.indexOf(\'</article>\', idx);',
  '    const t = strip(html.substring(idx, end === -1 ? Math.min(idx + 80000, html.length) : end));',
  '    if (t.length >= 200) return t;',
  '  }',
  '  for (const re of [/<article[\\s\\S]*?<\\/article>/i, /<main[\\s\\S]*?<\\/main>/i, /<body[\\s\\S]*?<\\/body>/i]) {',
  '    const m = re.exec(html);',
  '    if (m) { const t = strip(m[0]); if (t.length >= 200) return t; }',
  '  }',
  '  return \'\';',
  '}',
  '',
  '// items = HTTP responses, 1:1 and in order with the filtered items',
  'const chunks = [];',
  'const keys = [];',
  'for (let i = 0; i < items.length; i++) {',
  '  const base = srcItems[i] ? srcItems[i].json : null;',
  '  if (!base) continue;',
  '  let text = extractBody(items[i].json ? items[i].json.data : \'\');',
  '  if (!text) text = base.teaser; // fetch failed/blocked -> fall back to the feed teaser',
  '  if (!text) continue;',
  '  keys.push(base.dedup_key);',
  '  chunks.push(\'=== SOURCE: \' + base.source_name + \' | \' + base.published_date + \' | \' + base.url + \' ===\\n\'',
  '    + String(base.title || \'\') + \'\\n\' + text.slice(0, cfg.MAX_RAW_TEXT_CHARS));',
  '}',
  'if (chunks.length === 0) throw new Error(\'DIGEST: no article text could be extracted from any new item.\');',
  '',
  'const PROMPT = ' + JSON.stringify(DIGEST_PROMPT) + ';',
  'const message = PROMPT',
  '  + \'\\n\\nFOCUS AREA: \' + cfg.SEO_FOCUS',
  '  + \'\\nToday\\u2019s date: \' + today + \'.\'',
  '  + \'\\n\\nTHIS WEEK\\u2019S NEW ARTICLES (\' + chunks.length + \'):\\n\\n\' + chunks.join(\'\\n\\n\');',
  '',
  'return [{ json: {',
  '  run_date: today,',
  '  record_keys: keys,',
  '  articles_used: chunks.length,',
  '  requestBody: {',
  '    model: cfg.ANTHROPIC_MODEL,',
  '    max_tokens: cfg.DIGEST_MAX_TOKENS,',
  '    messages: [{ role: \'user\', content: message }]',
  '  }',
  '} }];',
].join('\n');

const composeCode = [
  '// Turn the Claude response into the briefing email. Throws (no email, no',
  '// recording) if the response is missing or suspiciously short — the same',
  '// items are then retried on the next run.',
  'const resp = items[0].json;',
  'const meta = $(\'Build Digest Prompt\').first().json;',
  'if (!resp || !Array.isArray(resp.content)) {',
  '  throw new Error(\'DIGEST: no Claude response (node disabled or call failed). Nothing emailed, nothing recorded.\');',
  '}',
  'const text = resp.content.filter(function (b) { return b.type === \'text\'; }).map(function (b) { return b.text; }).join(\'\').trim();',
  'if (text.length < 200) {',
  '  throw new Error(\'DIGEST: response too short to be a real briefing (\' + text.length + \' chars). Nothing emailed, nothing recorded.\');',
  '}',
  '',
  'const body = text',
  '  + \'\\n\\n\\u2014\\nAutomated SEO Research Bot \\u00b7 \' + meta.articles_used + \' new article(s) analyzed this run.\'',
  '  + \'\\nTo change the focus, feeds, or model, edit the Config node in n8n.\';',
  '',
  'return [{ json: {',
  '  email_subject: \'Your weekly SEO research briefing \\u2014 \' + meta.run_date,',
  '  email_body: body,',
  '  record_keys: meta.record_keys',
  '} }];',
].join('\n');

const recordCode = [
  '// Record dedup keys — reachable only after the Gmail node succeeded',
  '// (it throws on failure, which skips this node and leaves keys unrecorded).',
  'const cfg = $(\'Config\').first().json;',
  'const keys = $(\'Compose Digest Email\').first().json.record_keys || [];',
  'const sd = $getWorkflowStaticData(\'global\');',
  'sd.processedKeys = sd.processedKeys || [];',
  'let recorded = 0;',
  'for (const k of keys) {',
  '  if (k && sd.processedKeys.indexOf(k) === -1) { sd.processedKeys.push(k); recorded++; }',
  '}',
  'if (sd.processedKeys.length > cfg.HISTORY_CAP) {',
  '  sd.processedKeys = sd.processedKeys.slice(-cfg.HISTORY_CAP);',
  '}',
  'return [{ json: { recorded_keys: recorded, history_size: sd.processedKeys.length } }];',
].join('\n');

// ============================================================================
// NODES + CONNECTIONS
// ============================================================================
function codeNode(id, name, x, y, jsCode) {
  return { parameters: { jsCode: jsCode }, type: 'n8n-nodes-base.code', typeVersion: 2, position: [x, y], id: id, name: name };
}

const nodes = [
  {
    parameters: { rule: { interval: [{ field: 'cronExpression', expression: '0 6 * * 1' }] } },
    type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.2, position: [-1080, -160],
    id: 'trig-schedule', name: 'Weekly Schedule (Mon 06:00)',
  },
  { parameters: {}, type: 'n8n-nodes-base.manualTrigger', typeVersion: 1, position: [-1080, 40], id: 'trig-manual', name: 'Manual Trigger' },
  codeNode('cfg-node', 'Config', -860, -60, cfgCode),
  codeNode('split-feeds', 'Split Feeds', -640, -60, splitFeedsCode),
  {
    parameters: { url: '={{ $json.feed_url }}', options: {} },
    type: 'n8n-nodes-base.rssFeedRead', typeVersion: 1.1, position: [-420, -60],
    id: 'rss-read', name: 'Fetch RSS Feeds', onError: 'continueRegularOutput',
  },
  codeNode('filter-new', 'Filter New Items', -200, -60, filterCode),
  {
    parameters: {
      url: '={{ $json.url }}',
      // 15s timeout + NO retry + continue-on-fail: one slow or blocked page
      // can never hang the run — the item just falls back to its feed teaser.
      options: { response: { response: { responseFormat: 'text' } }, timeout: 15000 },
    },
    type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [20, -60],
    id: 'fetch-article', name: 'Fetch Article HTML', onError: 'continueRegularOutput',
  },
  codeNode('build-digest', 'Build Digest Prompt', 240, -60, buildDigestCode),
  {
    parameters: {
      method: 'POST',
      url: 'https://api.anthropic.com/v1/messages',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'anthropicApi',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'anthropic-version', value: '2023-06-01' }] },
      sendBody: true,
      specifyBody: 'json',
      jsonBody: '={{ JSON.stringify($json.requestBody) }}',
      options: { timeout: 600000 },
    },
    type: 'n8n-nodes-base.httpRequest', typeVersion: 4.2, position: [460, -60],
    id: 'claude-digest', name: 'Claude: Research Digest',
    retryOnFail: true, maxTries: 2, waitBetweenTries: 10000,
    credentials: { anthropicApi: { id: 'REPLACE_WITH_ANTHROPIC_CREDENTIAL', name: 'Anthropic account (replace me)' } },
  },
  codeNode('compose-email', 'Compose Digest Email', 680, -60, composeCode),
  {
    parameters: {
      sendTo: "={{ $('Config').first().json.DIGEST_EMAIL_TO }}",
      subject: '={{ $json.email_subject }}',
      emailType: 'text',
      message: '={{ $json.email_body }}',
      options: {},
    },
    type: 'n8n-nodes-base.gmail', typeVersion: 2.1, position: [900, -60],
    id: 'gmail-send', name: 'Gmail: Send Briefing', webhookId: 'gmail-send-briefing',
    credentials: { gmailOAuth2: { id: 'REPLACE_WITH_GMAIL_CREDENTIAL', name: 'Gmail account (replace me)' } },
  },
  codeNode('record-processed', 'Record Processed Keys', 1120, -60, recordCode),
  {
    parameters: {
      content: '## Automated SEO Research Bot (weekly, one LLM call)\nYour RSS sources -> last-N-days new items -> article text -> ONE Claude call writes a sourced briefing (headline findings with source links + a "what changed / why it matters" wrap-up) -> emailed to you via Gmail -> dedup keys recorded only after the email sends.\n\n- Fill in the CONFIG node (email, focus, feeds, model) — it is the only node you need to edit.\n- Nothing new this week -> the run ends quietly after "Filter New Items" (no email, no token spend).\n- A malformed model response -> "Compose Digest Email" THROWS: no email, nothing recorded, the same items retry next week. Optional: set an Error Trigger workflow (Settings -> Error Workflow) to get alerted.\n- Only paid dependency: your Anthropic API key (billing must be enabled). Credentials: Anthropic + Gmail.',
      width: 640, height: 300, color: 4,
    },
    type: 'n8n-nodes-base.stickyNote', typeVersion: 1, position: [-860, -500], id: 's-note', name: 'Note',
  },
];

const connections = {
  'Weekly Schedule (Mon 06:00)': { main: [[{ node: 'Config', type: 'main', index: 0 }]] },
  'Manual Trigger': { main: [[{ node: 'Config', type: 'main', index: 0 }]] },
  'Config': { main: [[{ node: 'Split Feeds', type: 'main', index: 0 }]] },
  'Split Feeds': { main: [[{ node: 'Fetch RSS Feeds', type: 'main', index: 0 }]] },
  'Fetch RSS Feeds': { main: [[{ node: 'Filter New Items', type: 'main', index: 0 }]] },
  'Filter New Items': { main: [[{ node: 'Fetch Article HTML', type: 'main', index: 0 }]] },
  'Fetch Article HTML': { main: [[{ node: 'Build Digest Prompt', type: 'main', index: 0 }]] },
  'Build Digest Prompt': { main: [[{ node: 'Claude: Research Digest', type: 'main', index: 0 }]] },
  'Claude: Research Digest': { main: [[{ node: 'Compose Digest Email', type: 'main', index: 0 }]] },
  'Compose Digest Email': { main: [[{ node: 'Gmail: Send Briefing', type: 'main', index: 0 }]] },
  'Gmail: Send Briefing': { main: [[{ node: 'Record Processed Keys', type: 'main', index: 0 }]] },
};

const workflow = {
  name: 'Automated SEO Research Bot',
  nodes: nodes,
  connections: connections,
  settings: { executionOrder: 'v1' },
  pinData: {},
};

// ============================================================================
// STRUCTURAL VALIDATION
// ============================================================================
let errors = 0;
function err(msg) { console.error('  x ' + msg); errors++; }

const nodeNames = new Set(nodes.map(n => n.name));
for (const [from, conns] of Object.entries(connections)) {
  if (!nodeNames.has(from)) err('connection FROM unknown node: ' + from);
  for (const outputs of conns.main) for (const c of outputs) {
    if (!nodeNames.has(c.node)) err('connection TO unknown node: ' + c.node + ' (from ' + from + ')');
  }
}
const targets = new Set();
for (const conns of Object.values(connections)) for (const outputs of conns.main) for (const c of outputs) targets.add(c.node);
for (const n of nodes) {
  if (n.type === 'n8n-nodes-base.stickyNote' || n.type.includes('Trigger')) continue;
  if (!targets.has(n.name)) err('orphan node (no incoming connection): ' + n.name);
}
for (const n of nodes) {
  if (n.type !== 'n8n-nodes-base.code') continue;
  try { new Function('$', 'items', '$getWorkflowStaticData', 'Buffer', n.parameters.jsCode); }
  catch (e) { err('code node syntax error in "' + n.name + '": ' + e.message); }
}
// No secrets, no personal values — belt and braces on top of the store's
// seed-time scan. The generated JSON must never contain any of these.
const jsonPreview = JSON.stringify(workflow);
for (const bad of ['sk-ant', '@gmail', '@revenuedealer', 'revenuedealer', 'ghp_', 'offercop', 'SELECT_YOUR_CREDENTIAL', 'Pest Ministry', 'Users\\\\hp']) {
  if (jsonPreview.toLowerCase().includes(bad.toLowerCase())) err('forbidden string in output: ' + bad);
}
console.log(errors ? 'Structural validation: FAILED' : 'Structural validation: OK');

// ============================================================================
// SELF-TESTS — execute each Code node's REAL jsCode against fixtures.
// The workflow JSON is only written if every test passes.
// ============================================================================
const cfg = new Function(cfgCode)()[0].json;
const nodeByName = name => nodes.find(n => n.name === name);
let failures = 0;
function expect(name, cond) {
  console.log('  ' + (cond ? 'PASS' : 'FAIL') + ': ' + name);
  if (!cond) failures++;
}

console.log('Self-tests:');

// ---- Config sanity (buyer-facing defaults)
expect('config: placeholder email (no real inbox baked in)', cfg.DIGEST_EMAIL_TO === 'your-email@example.com');
expect('config: 3 starter feeds', Array.isArray(cfg.SOURCE_FEEDS) && cfg.SOURCE_FEEDS.length === 3);
expect('config: default model claude-sonnet-4-6', cfg.ANTHROPIC_MODEL === 'claude-sonnet-4-6');
expect('config: 14-day window', cfg.RECENCY_WINDOW_DAYS === 14);

// ---- Split Feeds
const splitFn = new Function('$', nodeByName('Split Feeds').parameters.jsCode);
const feedItems = splitFn(() => ({ first: () => ({ json: cfg }) }));
expect('split-feeds: one item per configured feed', feedItems.length === cfg.SOURCE_FEEDS.length && feedItems[0].json.feed_url === cfg.SOURCE_FEEDS[0]);

// ---- Filter New Items
function runFilter(items, staticData) {
  const $ = () => ({ first: () => ({ json: cfg }) });
  const fn = new Function('$', 'items', '$getWorkflowStaticData', nodeByName('Filter New Items').parameters.jsCode);
  return fn($, items.map(j => ({ json: j })), () => staticData);
}
const nowIso = new Date().toISOString();
const oldIso = new Date(Date.now() - 40 * 86400000).toISOString();
const bingLink = 'http://www.bing.com/news/apiclick.aspx?ref=FexRss&aid=&url=' + encodeURIComponent('https://www.seroundtable.com/some-article.html') + '&c=1&mkt=en-us';
let out = runFilter([
  { link: 'https://developers.google.com/search/blog/post-1', title: 'Blog post', isoDate: nowIso, contentSnippet: 'teaser' },
  { link: bingLink, title: 'News post', isoDate: nowIso, contentSnippet: 'teaser' },
  { link: 'https://developers.google.com/search/blog/old', title: 'Old post', isoDate: oldIso },
  { link: 'https://developers.google.com/search/blog/seen', title: 'Seen post', isoDate: nowIso },
  { error: 'feed down' },
], { processedKeys: ['https://developers.google.com/search/blog/seen|' + nowIso] });
expect('filter: 2 of 5 kept (old, seen, error dropped)', out.length === 2);
expect('filter: aggregator publisher URL decoded', out[1].json.url === 'https://www.seroundtable.com/some-article.html');
expect('filter: sources labeled by hostname', out[0].json.source_name === 'developers.google.com' && out[1].json.source_name === 'seroundtable.com');
expect('filter: nothing new -> empty (quiet end)', runFilter([{ link: 'https://example.com/a', isoDate: oldIso }], {}).length === 0);

// ---- Build Digest Prompt
function runDigest(httpResponses, filtered) {
  const $ = name => ({
    first: () => ({ json: name === 'Config' ? cfg : null }),
    all: () => filtered.map(j => ({ json: j })),
  });
  const fn = new Function('$', 'items', nodeByName('Build Digest Prompt').parameters.jsCode);
  return fn($, httpResponses.map(j => ({ json: j })))[0].json;
}
const filtered = out.map(i => i.json);
const html = '<html><body><article>' + 'Google announced a real indexing change today. '.repeat(20) + '</article></body></html>';
let r = runDigest([{ data: html }, { error: 'blocked' }], filtered);
expect('digest: both articles in blob (teaser fallback on failed fetch)', r.articles_used === 2);
expect('digest: focus area injected from config', r.requestBody.messages[0].content.includes('FOCUS AREA: technical SEO + indexing'));
expect('digest: hard rules present verbatim', r.requestBody.messages[0].content.includes('Never invent news or URLs'));
expect('digest: source tags present', r.requestBody.messages[0].content.includes('=== SOURCE: developers.google.com'));
expect('digest: model from config', r.requestBody.model === 'claude-sonnet-4-6');
expect('digest: record_keys carried', r.record_keys.length === 2);
let threw = false;
try { runDigest([], []); } catch (e) { threw = true; }
expect('digest: zero usable articles throws (no silent empty call)', threw);

// ---- Compose Digest Email
function runCompose(resp, meta) {
  const $ = () => ({ first: () => ({ json: meta }) });
  const fn = new Function('$', 'items', nodeByName('Compose Digest Email').parameters.jsCode);
  return fn($, [{ json: resp }])[0];
}
const meta = { run_date: '2099-01-01', record_keys: ['k1', 'k2'], articles_used: 2 };
const briefing = 'HEADLINE FINDINGS\n\n1. Google clarified how the crawler handles X. Do Y about it.\nhttps://developers.google.com/search/blog/post-1\n\nWHAT CHANGED / WHY IT MATTERS\n' + 'The week in one paragraph. '.repeat(10);
r = runCompose({ content: [{ type: 'text', text: briefing }] }, meta);
expect('compose: subject dated', r.json.email_subject === 'Your weekly SEO research briefing — 2099-01-01');
expect('compose: briefing is the body', r.json.email_body.startsWith('HEADLINE FINDINGS'));
expect('compose: footer notes articles analyzed', r.json.email_body.includes('2 new article(s) analyzed'));
expect('compose: record_keys carried', r.json.record_keys.length === 2);
threw = false;
try { runCompose({ content: 'not-an-array' }, meta); } catch (e) { threw = true; }
expect('compose: missing response throws (no email, no recording)', threw);
threw = false;
try { runCompose({ content: [{ type: 'text', text: 'too short' }] }, meta); } catch (e) { threw = true; }
expect('compose: suspiciously short response throws', threw);

// ---- Record Processed Keys
const sd = { processedKeys: ['k1'] };
const recFn = new Function('$', '$getWorkflowStaticData', nodeByName('Record Processed Keys').parameters.jsCode);
const rec = recFn(name => ({ first: () => ({ json: name === 'Config' ? cfg : { record_keys: ['k1', 'k2', 'k3'] } }) }), () => sd)[0].json;
expect('record: only new keys recorded', rec.recorded_keys === 2 && sd.processedKeys.length === 3);

// ============================================================================
// EMIT — only if everything passed
// ============================================================================
if (errors || failures) {
  console.error('\nBUILD FAILED: ' + errors + ' structural error(s), ' + failures + ' test failure(s). Nothing written.');
  process.exit(1);
}
const json = JSON.stringify(workflow, null, 2);
JSON.parse(json); // round-trip sanity
fs.writeFileSync(OUT, json, 'utf8');
const functional = nodes.filter(n => n.type !== 'n8n-nodes-base.stickyNote').length;
console.log('\nAll checks passed. Wrote ' + OUT + ' (' + Math.round(json.length / 1024) + ' KB, ' + functional + ' functional nodes + 1 sticky note)');
