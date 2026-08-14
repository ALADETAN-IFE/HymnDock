/**
 * state.controller.ts
 *
 * Handles GET /api/v1/state and POST /api/v1/state.
 * Mirrors Python's Handler.do_GET() and do_POST() branches for /api/v1/state.
 */

import { Request, Response } from "express";
import { getState, updateState } from "./state.store";
import { logger } from "@/utils";
import type { AppState, DisplaySettings, HymnData } from "../hymn/hymn.types";

export const readState = (_req: Request, res: Response): void => {
  res.status(200).json({ ok: true, state: getState() });
};

export const writeState = (req: Request, res: Response): void => {
  try {
    const body = req.body as Partial<{
      hymn: HymnData | null;
      section: string | null;
      stanza: number | null;
      settings: Partial<DisplaySettings>;
    }>;

    const patch: Parameters<typeof updateState>[0] = {};

    if ("hymn" in body) patch.hymn = body.hymn ?? null;
    if ("section" in body) patch.section = body.section ?? null;
    if ("stanza" in body) patch.stanza = (body.stanza as AppState["stanza"]) ?? null;
    if ("settings" in body) patch.settings = body.settings ?? {};

    const newState = updateState(patch);
    logger.info("State", "State updated");
    res.status(200).json({ ok: true, state: newState });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ ok: false, error: message });
  }
};
