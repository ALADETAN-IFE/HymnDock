/**
 * state.store.ts
 *
 * Per-session state backed by SQLite.
 * Each OBS operator gets a private UUID session — sessions are fully isolated.
 * Also manages the SSE client registry for real-time push updates.
 */

import type { Response } from "express";
import type { AppState, DisplaySettings } from "../hymn/hymn.types";
import { db } from "@/config";

// ---------------------------------------------------------------------------
// Default settings
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: DisplaySettings = {
  show_title: true,
  show_hymn_number: true,
  show_section: false,
  font_size: 58,
  max_width: 1500,
  line_height: 1.35,
  text_align: "center",
};

function defaultState(): AppState {
  return {
    hymn: null,
    section: null,
    stanza: null,
    settings: { ...DEFAULT_SETTINGS },
  };
}

// ---------------------------------------------------------------------------
// SQLite statements
// ---------------------------------------------------------------------------

const stmtGet = db.prepare<[string], { state: string }>(
  "SELECT state FROM sessions WHERE id = ?",
);

const stmtSet = db.prepare<[string, string]>(
  `INSERT INTO sessions (id, state, updated_at) VALUES (?, ?, unixepoch())
   ON CONFLICT(id) DO UPDATE SET state = excluded.state, updated_at = unixepoch()`,
);

// ---------------------------------------------------------------------------
// SSE client registry  Map<sessionId, Set<Response>>
// ---------------------------------------------------------------------------

const sseClients = new Map<string, Set<Response>>();

export function registerSseClient(sessionId: string, res: Response): void {
  if (!sseClients.has(sessionId)) sseClients.set(sessionId, new Set());
  sseClients.get(sessionId)!.add(res);
}

export function unregisterSseClient(sessionId: string, res: Response): void {
  sseClients.get(sessionId)?.delete(res);
}

function broadcastToSession(sessionId: string, state: AppState): void {
  const clients = sseClients.get(sessionId);
  if (!clients || clients.size === 0) return;
  const payload = `data: ${JSON.stringify({ ok: true, state })}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch {
      // Client already disconnected — will be cleaned up via 'close' event
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getState(sessionId: string): AppState {
  const row = stmtGet.get(sessionId);
  if (!row) return defaultState();
  try {
    return JSON.parse(row.state) as AppState;
  } catch {
    return defaultState();
  }
}

export function updateState(
  sessionId: string,
  patch: Partial<Pick<AppState, "hymn" | "section" | "stanza">> & {
    settings?: Partial<DisplaySettings>;
  },
): AppState {
  const current = getState(sessionId);

  if ("hymn" in patch) current.hymn = patch.hymn ?? null;
  if ("section" in patch) current.section = patch.section ?? null;
  if ("stanza" in patch) current.stanza = patch.stanza ?? null;
  if (patch.settings) {
    current.settings = { ...current.settings, ...patch.settings };
  }

  stmtSet.run(sessionId, JSON.stringify(current));
  broadcastToSession(sessionId, current);

  return current;
}
