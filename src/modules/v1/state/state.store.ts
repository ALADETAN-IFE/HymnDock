/**
 * state.store.ts
 *
 * In-memory singleton state shared between the OBS Dock and Browser Source.
 * Intentionally kept in-memory (no database) — mirrors the Python prototype.
 */

import type { AppState } from "../hymn/hymn.types";

const state: AppState = {
  hymn: null,
  section: null,
  stanza: null,
  settings: {
    show_title: true,
    show_hymn_number: true,
    show_section: false,
    font_size: 58,
    max_width: 1500,
    line_height: 1.35,
    text_align: "center",
  },
};

export function getState(): AppState {
  return state;
}

export function updateState(
  patch: Partial<Pick<AppState, "hymn" | "section" | "stanza">> & {
    settings?: Partial<AppState["settings"]>;
  },
): AppState {
  if ("hymn" in patch) state.hymn = patch.hymn ?? null;
  if ("section" in patch) state.section = patch.section ?? null;
  if ("stanza" in patch) state.stanza = patch.stanza ?? null;

  if (patch.settings) {
    state.settings = { ...state.settings, ...patch.settings };
  }

  return state;
}
