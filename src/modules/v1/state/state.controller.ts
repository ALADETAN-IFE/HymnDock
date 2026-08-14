/**
 * state.controller.ts
 *
 * GET  /api/v1/state?session=<id>         → read session state
 * POST /api/v1/state?session=<id>         → patch session state
 * GET  /api/v1/state/events?session=<id>  → SSE stream (real-time push)
 */

import { Request, Response } from "express";
import {
  getState,
  updateState,
  registerSseClient,
  unregisterSseClient,
} from "./state.store";
import { logger } from "@/utils";
import type { AppState, DisplaySettings, HymnData } from "../hymn/hymn.types";

// ── Helpers ─────────────────────────────────────────────────────────────────

function resolveSession(req: Request, res: Response): string {
  const id = (req.query["session"] as string | undefined)?.trim();
  return id || "default";
}

// ── GET /api/v1/state ────────────────────────────────────────────────────────

export const readState = (req: Request, res: Response): void => {
  const sessionId = resolveSession(req, res);
  if (!sessionId) return;
  res.status(200).json({ ok: true, state: getState(sessionId) });
};

// ── POST /api/v1/state ───────────────────────────────────────────────────────

export const writeState = (req: Request, res: Response): void => {
  const sessionId = resolveSession(req, res);
  if (!sessionId) return;

  try {
    const body = req.body as Partial<{
      hymn: HymnData | null;
      section: string | null;
      stanza: number | null;
      settings: Partial<DisplaySettings>;
    }>;

    const patch: Parameters<typeof updateState>[1] = {};

    if ("hymn" in body) patch.hymn = body.hymn ?? null;
    if ("section" in body) patch.section = body.section ?? null;
    if ("stanza" in body) patch.stanza = (body.stanza as AppState["stanza"]) ?? null;
    if ("settings" in body) patch.settings = body.settings ?? {};

    const newState = updateState(sessionId, patch);
    logger.info("State", `Session ${sessionId} updated`);
    res.status(200).json({ ok: true, state: newState });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ ok: false, error: message });
  }
};

// ── GET /api/v1/state/events — SSE stream ────────────────────────────────────

export const sseStream = (req: Request, res: Response): void => {
  const sessionId = resolveSession(req, res);
  if (!sessionId) return;

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable Nginx buffering if behind proxy
  res.flushHeaders();

  // Send current state immediately on connect so the display populates at once
  const initial = getState(sessionId);
  res.write(`data: ${JSON.stringify({ ok: true, state: initial })}\n\n`);

  // Keep-alive ping every 25s to prevent proxy/browser timeouts
  const pingInterval = setInterval(() => {
    try {
      res.write(`: ping\n\n`);
    } catch {
      clearInterval(pingInterval);
    }
  }, 25_000);

  // Register client
  registerSseClient(sessionId, res);
  logger.info("SSE", `Client connected to session ${sessionId}`);

  // Clean up on disconnect
  req.on("close", () => {
    clearInterval(pingInterval);
    unregisterSseClient(sessionId, res);
    logger.info("SSE", `Client disconnected from session ${sessionId}`);
  });
};
