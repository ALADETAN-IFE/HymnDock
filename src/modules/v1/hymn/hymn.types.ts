// ---------------------------------------------------------------------------
// Types that mirror the Python server's data structures
// ---------------------------------------------------------------------------

export interface Stanza {
  number: number;
  lines: string[];
}

/** Map of section name → stanzas, e.g. { "Hymn": [...] } or { "APA I": [...] } */
export type Sections = Record<string, Stanza[]>;

export interface HymnData {
  number: number | null;
  title: string;
  url: string;
  sections: Sections;
  previous: string | null;
  next: string | null;
}

// ---------------------------------------------------------------------------
// Display settings (mirrors Python's state["settings"])
// ---------------------------------------------------------------------------

export interface DisplaySettings {
  show_title: boolean;
  show_hymn_number: boolean;
  show_section: boolean;
  font_size: number;
  max_width: number;
  line_height: number;
  text_align: "center" | "left" | "right";
}

// ---------------------------------------------------------------------------
// In-memory application state
// ---------------------------------------------------------------------------

export interface AppState {
  hymn: HymnData | null;
  section: string | null;
  stanza: number | null;
  settings: DisplaySettings;
}

// ---------------------------------------------------------------------------
// API response shapes
// ---------------------------------------------------------------------------

export interface OkHymnResponse {
  ok: true;
  hymn: HymnData;
}

export interface OkStateResponse {
  ok: true;
  state: AppState;
}

export interface ErrorResponse {
  ok: false;
  error: string;
}
