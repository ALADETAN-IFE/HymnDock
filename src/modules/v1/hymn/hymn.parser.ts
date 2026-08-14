/**
 * hymn.parser.ts
 *
 * TypeScript port of the Python server's HTML scraping and hymn-parsing logic.
 *
 * Improvements over the original:
 *  - Native `fetch` + AbortSignal.timeout() replaces the verbose https.request callback
 *  - Permanent SQLite cache: hymns are scraped once and stored forever in
 *    hymn_cache and hymn_url_cache tables. A "Refresh" button on the dock
 *    calls bustHymnCache() to force a re-scrape.
 */

import { Parser } from "htmlparser2";
import type { HymnData, Sections, Stanza } from "./hymn.types";
import { db } from "@/config";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE = "https://treasurehymns.com";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
    "AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/131 Safari/537.36 HymnDock/2.0",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9," +
    "image/avif,image/webp,*/*;q=0.8",
};

// ---------------------------------------------------------------------------
// Block-level HTML tags (mirrors Python's HTMLTextParser.BLOCK_TAGS)
// ---------------------------------------------------------------------------

const BLOCK_TAGS = new Set([
  "p", "div", "br", "li", "ul", "ol",
  "h1", "h2", "h3", "h4", "h5", "h6",
  "article", "section", "header", "footer",
  "main", "aside", "blockquote", "tr", "td", "th", "pre",
]);

// ---------------------------------------------------------------------------
// Regex patterns (mirrors Python's compiled patterns)
// ---------------------------------------------------------------------------

const STOP_LINES =
  /^(Previous:|Next:|Your email address|Comment|Name|Email|Website|Search$|Search Results for|Hymns You May Like|Archives|Categories|Share|Related Posts|Leave a Reply|Post navigation)/i;

const NUMBERED_STANZA = /^\s*(\d{1,2})\s*(?:[.)\-:])\s*(.*)$/;
const NUMBERED_STANZA_SPACE = /^\s*(\d{1,2})\s+(.+?)\s*$/;
const APA_HEADING = /^\s*APA\s*([IVXLCDM]+|\d+)?\s*$/i;

// ---------------------------------------------------------------------------
// HTML text parser
// ---------------------------------------------------------------------------

interface LinkItem {
  href: string | null;
  text: string;
}

interface ParsedPage {
  lines: string[];
  links: LinkItem[];
  title: string;
}

function parseHtmlPage(html: string): ParsedPage {
  const lines: string[] = [];
  const links: LinkItem[] = [];
  let buf: string[] = [];
  let anchor: { href: string | null; text: string[] } | null = null;
  const titleParts: string[] = [];
  let inTitle = false;

  function flush() {
    const text = buf.join("").replace(/\s+/g, " ").trim();
    if (text) lines.push(text);
    buf = [];
  }

  const parser = new Parser(
    {
      onopentag(name: string, attrs: Record<string, string>) {
        if (BLOCK_TAGS.has(name)) flush();
        if (name === "title") inTitle = true;
        if (name === "a") anchor = { href: attrs["href"] ?? null, text: [] };
      },
      onclosetag(name: string) {
        if (BLOCK_TAGS.has(name)) flush();
        if (name === "title") inTitle = false;
        if (name === "a" && anchor !== null) {
          const text = anchor.text.join("").replace(/\s+/g, " ").trim();
          links.push({ href: anchor.href, text });
          anchor = null;
        }
      },
      ontext(data: string) {
        if (inTitle) titleParts.push(data);
        buf.push(data);
        if (anchor) anchor.text.push(data);
      },
    },
    { decodeEntities: true },
  );

  parser.write(html);
  parser.end();

  const remaining = buf.join("").replace(/\s+/g, " ").trim();
  if (remaining) lines.push(remaining);

  return {
    lines,
    links,
    title: titleParts.join("").replace(/\s+/g, " ").trim(),
  };
}

// ---------------------------------------------------------------------------
// HTTP fetch — native Node fetch with AbortSignal timeout
// ---------------------------------------------------------------------------

export async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(25_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  return response.text();
}

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

function cleanUrl(href: string | null): string | null {
  if (!href) return null;
  try {
    return new URL(href, BASE).toString();
  } catch {
    return null;
  }
}

function normalizeText(text: string | null | undefined): string {
  return (text ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function hymnNumberFromText(text: string | null | undefined): number | null {
  if (!text) return null;
  const match = /\bhymn\s*[-#]?\s*(\d{1,4})\b/i.exec(text);
  return match ? parseInt(match[1], 10) : null;
}

function isTreasureHymnUrl(url: string | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host !== "treasurehymns.com" && host !== "www.treasurehymns.com") return false;
    return /\/hymn-\d{1,4}(?:-|\/)/.test(parsed.pathname.toLowerCase());
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// SQLite-backed findHymnUrl
// ---------------------------------------------------------------------------

const stmtGetUrlCache = db.prepare<[number], { url: string }>(
  "SELECT url FROM hymn_url_cache WHERE number = ?",
);
const stmtSetUrlCache = db.prepare<[number, string]>(
  "INSERT OR REPLACE INTO hymn_url_cache (number, url, cached_at) VALUES (?, ?, unixepoch())",
);

export async function findHymnUrl(number: number): Promise<string | null> {
  // 1. Check SQLite cache first
  const cached = stmtGetUrlCache.get(number);
  if (cached) return cached.url;

  // 2. Cache miss — search the site
  const searchQueries = [String(number), `hymn ${number}`, `hymn-${number}`];
  const searchUrls: string[] = [];
  const seen = new Set<string>();

  for (const query of searchQueries) {
    const encoded = encodeURIComponent(query);
    const candidates = [
      `${BASE}/?s=${encoded}`,
      `${BASE}/yor/?s=${encoded}`,
      `${BASE}/yor/youruba-iwe-orin-mimo-anglican-hymnbook/?s=${encoded}`,
    ];
    for (const u of candidates) {
      if (!seen.has(u)) { seen.add(u); searchUrls.push(u); }
    }
  }

  const scored: Array<[number, string]> = [];

  for (const searchUrl of searchUrls) {
    let html: string;
    try { html = await fetchHtml(searchUrl); } catch { continue; }

    const { links } = parseHtmlPage(html);

    for (const link of links) {
      const href = cleanUrl(link.href);
      if (!isTreasureHymnUrl(href)) continue;

      const linkNumber = hymnNumberFromText(link.text);
      const hrefDecoded = decodeURIComponent(new URL(href!).pathname);
      const hrefNumber = hymnNumberFromText(hrefDecoded);

      let score = 0;
      if (linkNumber === number) score += 100;
      if (hrefNumber === number) score += 80;
      const normText = normalizeText(link.text);
      if (normText.includes(`hymn ${number}`)) score += 40;
      if (normalizeText(href).includes(`hymn-${number}-`)) score += 30;
      if (normText.includes("lyrics") || normalizeText(href).includes("lyrics")) score += 10;

      if (score > 0) scored.push([score, href!]);
    }
  }

  if (scored.length > 0) {
    scored.sort((a, b) => b[0] - a[0]);
    const seenUrls = new Set<string>();
    for (const [, href] of scored) {
      if (!seenUrls.has(href)) {
        seenUrls.add(href);
        // 3. Persist to cache before returning
        stmtSetUrlCache.run(number, href);
        return href;
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Stanza / verse parsing helpers
// ---------------------------------------------------------------------------

function isProbableStanza(line: string): [number, string] | null {
  let m = NUMBERED_STANZA.exec(line);
  if (m && m[2].trim()) return [parseInt(m[1], 10), m[2].trim()];

  m = NUMBERED_STANZA_SPACE.exec(line);
  if (m && m[2].trim()) {
    const num = parseInt(m[1], 10);
    if (num <= 99) return [num, m[2].trim()];
  }
  return null;
}

function appendLine(stanza: Stanza, line: string): void {
  const cleaned = line.replace(/\s+/g, " ").trim();
  if (!cleaned) return;
  if (stanza.lines.length > 0 && stanza.lines[stanza.lines.length - 1] === cleaned) return;
  stanza.lines.push(cleaned);
}

function parseSectionedVerses(lines: string[]): Sections {
  const sections: Sections = {};
  let currentSection: string | null = null;
  let currentStanza: Stanza | null = null;

  for (const line of lines) {
    if (STOP_LINES.test(line)) { if (currentSection) break; continue; }

    const headingMatch = APA_HEADING.exec(line);
    if (headingMatch) {
      const suffix = headingMatch[1];
      currentSection = suffix ? `APA ${suffix.toUpperCase()}` : "APA";
      if (!sections[currentSection]) sections[currentSection] = [];
      currentStanza = null;
      continue;
    }

    if (currentSection === null) continue;

    const stanza = isProbableStanza(line);
    if (stanza) {
      const [number, firstText] = stanza;
      currentStanza = { number, lines: [firstText] };
      sections[currentSection].push(currentStanza);
    } else if (currentStanza) {
      appendLine(currentStanza, line);
    }
  }

  return Object.fromEntries(Object.entries(sections).filter(([, v]) => v.length > 0));
}

function parseNumberedVerses(lines: string[]): Stanza[] {
  let firstIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const s = isProbableStanza(lines[i]);
    if (s && s[0] === 1) { firstIndex = i; break; }
  }
  if (firstIndex === -1) return [];

  const verses: Stanza[] = [];
  let current: Stanza | null = null;

  for (const line of lines.slice(firstIndex)) {
    if (STOP_LINES.test(line)) break;

    const stanza = isProbableStanza(line);
    if (stanza) {
      const [number, firstText] = stanza;
      if (current !== null) {
        if (number === current.number) { appendLine(current, firstText); continue; }
        if (number === current.number + 1) { verses.push(current); current = { number, lines: [firstText] }; continue; }
        if (number > current.number && number <= current.number + 3) { verses.push(current); current = { number, lines: [firstText] }; continue; }
        break;
      }
      current = { number, lines: [firstText] };
    } else if (current) {
      appendLine(current, line);
    }
  }

  if (current) verses.push(current);
  return verses.filter(v => v.number >= 1 && v.lines.some(t => t.length > 2));
}

function findHymnTitle(lines: string[], requestedNumber: number | null): string {
  if (requestedNumber !== null) {
    const pattern = new RegExp(`^Hymn\\s+${requestedNumber}\\b.*`, "i");
    for (const line of lines) { if (pattern.test(line)) return line; }
  }
  for (const line of lines) { if (/^Hymn\s+\d+\b/i.test(line)) return line; }
  return "";
}

function parsePreviousNext(html: string): [string | null, string | null] {
  const { links } = parseHtmlPage(html);
  let previous: string | null = null;
  let next: string | null = null;
  for (const link of links) {
    const text = normalizeText(link.text);
    const href = cleanUrl(link.href);
    if (!href) continue;
    if (text.startsWith("previous:") || text === "previous") previous = href;
    else if (text.startsWith("next:") || text === "next") next = href;
  }
  return [previous, next];
}

// ---------------------------------------------------------------------------
// SQLite-backed parseHymn — the main entry point
// ---------------------------------------------------------------------------

const stmtGetHymnCache = db.prepare<[string], { data: string }>(
  "SELECT data FROM hymn_cache WHERE url = ?",
);
const stmtSetHymnCache = db.prepare<[string, number | null, string]>(
  "INSERT OR REPLACE INTO hymn_cache (url, number, data, cached_at) VALUES (?, ?, ?, unixepoch())",
);

export async function parseHymn(url: string): Promise<HymnData> {
  // 1. Check SQLite cache first — instant if already scraped
  const cached = stmtGetHymnCache.get(url);
  if (cached) {
    return JSON.parse(cached.data) as HymnData;
  }

  // 2. Cache miss — fetch and parse
  const html = await fetchHtml(url);
  const { lines: rawLines, title: pageTitle } = parseHtmlPage(html);
  const lines = rawLines.map(l => l.trim()).filter(Boolean);

  const requestedNumber = hymnNumberFromText(url);
  let title = findHymnTitle(lines, requestedNumber);
  if (!title) title = pageTitle || "Hymn";

  const hymnNumber = hymnNumberFromText(title) ?? requestedNumber;

  let titleIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (title && normalizeText(lines[i]) === normalizeText(title)) { titleIndex = i; break; }
  }

  const body = titleIndex >= 0 ? lines.slice(titleIndex + 1) : lines;

  let sections: Sections = parseSectionedVerses(body);
  if (Object.keys(sections).length === 0) {
    const numbered = parseNumberedVerses(body);
    if (numbered.length > 0) sections = { Hymn: numbered };
  }
  if (Object.keys(sections).length === 0) {
    sections = parseSectionedVerses(lines);
  }
  if (Object.keys(sections).length === 0) {
    const numbered = parseNumberedVerses(lines);
    if (numbered.length > 0) sections = { Hymn: numbered };
  }
  if (Object.keys(sections).length === 0) {
    throw new Error(
      "Could not detect hymn verses on the individual Treasure Hymns page. " +
      "The search result was found, but its lyric structure could not be parsed.",
    );
  }

  const [previous, next] = parsePreviousNext(html);

  const hymn: HymnData = { number: hymnNumber, title, url, sections, previous, next };

  // 3. Persist to SQLite for next time
  stmtSetHymnCache.run(url, hymnNumber, JSON.stringify(hymn));

  return hymn;
}

// ---------------------------------------------------------------------------
// Cache busting — called by the Refresh button on the dock
// ---------------------------------------------------------------------------

const stmtBustHymnByUrl = db.prepare<[string]>(
  "DELETE FROM hymn_cache WHERE url = ?",
);
const stmtBustUrlByNumber = db.prepare<[string]>(
  "DELETE FROM hymn_url_cache WHERE url = ?",
);

export function bustHymnCache(url: string): void {
  stmtBustHymnByUrl.run(url);
  stmtBustUrlByNumber.run(url);
}
