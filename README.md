# HymnDock 🎵

A high-performance TypeScript backend server, interactive control dock, and live OBS Studio browser source overlays for church services and live broadcasting. It scrapes, parses, and formats hymn lyrics from [Treasure Hymns](https://treasurehymns.com) in real-time across English and Yorùbá collections.

---

## About this Scaffold

This project was generated using the `@ifecodes/backend-template` scaffold. You can recreate or customize this scaffold using the CLI:

- Run without installing (recommended): `npx ifecodes-template`
- Install globally: `npm i -g @ifecodes/backend-template` and run `ifecodes-template`

---

## ⚡ Key Features

- **⚡ Permanent SQLite Caching**: Hymns are scraped once and stored permanently in SQLite (`data/hymn_dock.db`). Repeat hymn loads are near-instant (< 10ms), even after server restarts.
- **🌐 All-Language Hymn Search**: Search across English, Yorùbá, Anglican, CAC, and Baptist hymn collections by hymn number or song title keywords (e.g. `235`, `Amazing Grace`, `All Things bright`).
- **🔍 Multiple Search Results Picker**: When a search term matches multiple hymns, HymnDock displays interactive result selection cards so operators can pick the exact hymn version.
- **🖼️ Browser-Only Background Image Upload**: Upload high-resolution background graphics right from your browser. Resized automatically to 1080p and saved in `localStorage` without database storage.
- **📺 Live Dock Overlay Preview Box**: Built-in scaled live preview screen right inside the control dock so operators can monitor real-time OBS output without a separate monitor.
- **🎨 Preset Theme Palettes**: One-click visual styling presets (*Clean Minimal*, *Glassmorphism*, *Gold Accents*, *High Contrast*).
- **🔤 Google Fonts Integration**: Dynamic typography support (*Inter*, *Outfit*, *Cinzel*, *Playfair Display*, *Roboto*, *Montserrat*, *Segoe UI*).
- **🏷️ Top-Right Branding Logo**: Display or hide your church/broadcast logo cleanly in the top-right corner of OBS overlays.
- **⌨️ Numpad & Keyboard Quick-Keys**: Jump directly to verses using digits `1`-`9` or Numpad keys, step with arrow keys, and launch searches with `Enter`.
- **🔄 On-Demand Cache Refresh**: Built-in **Refresh** button on the dock to force a re-scrape if lyrics on Treasure Hymns are updated.
- **📡 Real-Time SSE Push**: Uses **Server-Sent Events** (`/api/v1/state/events`) so OBS Browser Source overlays update instantly (~100ms) when a stanza is clicked.
- **🔒 Multi-Session Isolation**: Supports multiple independent operators/rooms on a single server using session names (defaults to `default` — zero setup required for single-user mode).
- **📺 OBS Browser Source Overlays**:
  - `/dock` (or `/`) — Interactive control dock UI.
  - `/display` — Full-screen transparent overlay with clean, centered hymn lyrics.
  - `/display_bottom` — Full-screen overlay with a sleek dark gradient backdrop.
- **📚 Interactive OpenAPI Docs**: Full Swagger UI documentation auto-generated at `/api-docs`.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (v18 or higher)
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: SQLite via `better-sqlite3` (WAL mode enabled)
- **HTML Parsing**: `htmlparser2` (fast SAX parser)
- **Security & Logging**: Helmet (CSP-configured), Morgan, Custom Logger
- **API Documentation**: Swagger UI Express (`swagger-ui-express`)

---

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- npm or yarn

### Installation

1. Navigate to the project directory:
   ```bash
   cd hymn_dock_ts
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

---

## 🏃 Running the Application

### Development (Hot-Reload)

```bash
npm run dev
```

### Production Build & Run

```bash
npm run build
npm start
```

Default server URL: `https://hymn-dock.onrender.com`

---

## 📺 OBS Studio Setup Guide

### 1. Control Dock in OBS
1. Open OBS Studio.
2. Go to **Docks** → **Custom Browser Docks...**
3. Set **Dock Name** to `HymnDock`.
4. Set **URL** to `https://hymn-dock.onrender.com/dock` (or `https://hymn-dock.onrender.com/`).
5. Click **Apply**.

### 2. Browser Source Overlay in OBS
1. In your OBS Scene, add a new **Browser** source named `Hymn Display`.
2. Set **URL** to:
   - `https://hymn-dock.onrender.com/display` (for standard centered lyrics)
   - **OR** `https://hymn-dock.onrender.com/display_bottom` (for full-screen gradient overlay)
3. Set **Width**: `1920` and **Height**: `1080`.
4. Click **OK**.

> 💡 **Zero Config Needed**: OBS connects automatically to the `default` session. No copying of session IDs required!

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` or `/dock` | HymnDock control dock UI |
| `GET` | `/display` | OBS Browser Source overlay |
| `GET` | `/display_bottom` | Full-screen dark gradient overlay |
| `GET` | `/api/v1/hymn` | Search & fetch hymn (`?number=`, `?query=`, `?url=`, `?lang=`) |
| `DELETE` | `/api/v1/hymn/cache` | Bust SQLite cache for a hymn URL (`?url=`) |
| `GET` | `/api/v1/state` | Get current active state (`?session=`) |
| `POST` | `/api/v1/state` | Update active state / stanza / settings (`?session=`) |
| `GET` | `/api/v1/state/events` | SSE real-time state stream (`?session=`) |
| `GET` | `/api-docs` | Interactive Swagger API documentation |
