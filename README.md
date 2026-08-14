# Hymn Dock (TypeScript)

A high-performance TypeScript backend server, interactive control dock, and OBS Studio browser source overlays for church services and live broadcasting. It scrapes, parses, and formats hymn lyrics from [Treasure Hymns](https://treasurehymns.com) in real-time.

---

## ⚡ Key Features

- **⚡ Permanent SQLite Caching**: Hymns are scraped once and stored permanently in SQLite (`data/hymn_dock.db`). Repeat hymn loads are near-instant (< 10ms), even after server restarts.
- **🔄 On-Demand Cache Refresh**: Built-in **Refresh** button on the dock to force a re-scrape if lyrics on Treasure Hymns are updated.
- **📡 Real-Time SSE Push**: Uses **Server-Sent Events** (`/api/v1/state/events`) so OBS Browser Source overlays update instantly (~100ms) when a stanza is clicked.
- **🔒 Multi-Session Isolation**: Supports multiple independent operators/rooms on a single server using session names (defaults to `default` — zero setup required for single-user mode).
- **📺 OBS Browser Source Overlays**:
  - `/dock` (or `/`) — Control dock UI for searching hymns, clicking stanzas, and tweaking display settings.
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

Default server URL: `https://hymn-dock-obs.onrender.com`

---

## 📺 OBS Studio Setup Guide

### 1. Control Dock in OBS
1. Open OBS Studio.
2. Go to **Docks** → **Custom Browser Docks...**
3. Set **Dock Name** to `Hymn Dock`.
4. Set **URL** to `https://hymn-dock-obs.onrender.com/dock` (or `https://hymn-dock-obs.onrender.com/`).
5. Click **Apply**.

### 2. Browser Source Overlay in OBS
1. In your OBS Scene, add a new **Browser** source named `Hymn Display`.
2. Set **URL** to:
   - `https://hymn-dock-obs.onrender.com/display` (for standard centered lyrics)
   - **OR** `https://hymn-dock-obs.onrender.com/display_bottom` (for full-screen gradient overlay)
3. Set **Width**: `1920` and **Height**: `1080`.
4. Click **OK**.

> 💡 **Zero Config Needed**: OBS connects automatically to the `default` session. No copying of session IDs required!

---

## 📡 API Endpoints

Base URL: `https://hymn-dock-obs.onrender.com`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` or `/dock` | OBS Dock control panel UI |
| `GET` | `/display` | Full-screen transparent OBS overlay |
| `GET` | `/display_bottom` | Full-screen gradient backdrop OBS overlay |
| `GET` | `/api/v1/hymn?number=235` | Fetch & parse hymn by number (SQLite-cached) |
| `GET` | `/api/v1/hymn?url=...` | Fetch & parse hymn by URL (SQLite-cached) |
| `DELETE` | `/api/v1/hymn/cache?url=...` | Bust SQLite cache and re-scrape a hymn |
| `GET` | `/api/v1/state?session=default` | Get current display state for a session |
| `POST` | `/api/v1/state?session=default` | Update display state (broadcasts via SSE) |
| `GET` | `/api/v1/state/events?session=default` | **SSE stream** for real-time display pushes |
| `GET` | `/api/v1/health` | Server health & memory metrics |
| `GET` | `/api-docs` | Interactive Swagger UI documentation |

---

## 📁 Project Structure

```
hymn_dock_ts/
├── data/                    # SQLite database directory (ignored by git)
│   └── hymn_dock.db
├── public/                  # Static HTML overlay pages
│   ├── dock.html
│   ├── display.html
│   └── display_bottom.html
├── src/
│   ├── config/              # Configuration & SQLite DB connection
│   │   ├── db.ts
│   │   ├── env.ts
│   │   └── index.ts
│   ├── docs/                # OpenAPI route registry & Swagger generator
│   ├── middlewares/         # Express middlewares (error, logger, CORS)
│   ├── modules/             # Feature modules (v1 API)
│   │   └── v1/
│   │       ├── health/      # Health check module
│   │       ├── hymn/        # Hymn scraper & SQLite cache module
│   │       └── state/       # Session state store & SSE stream module
│   ├── utils/               # Logger & error utilities
│   ├── app.ts               # Express application configuration
│   ├── routes.ts            # Top-level route setup
│   └── server.ts            # Entry point
├── package.json
└── tsconfig.json
```

---

## ⚙️ Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | HTTP server port | `4000` |
| `NODE_ENV` | Environment mode (`development` / `production`) | `development` |

---

## 🛠️ Available Scripts

- `npm run dev` — Start development server with hot-reload (`ts-node-dev`)
- `npm run build` — Compile TypeScript to `dist/`
- `npm start` — Run production server from `dist/`
- `npm run lint` — Run ESLint checks
- `npm run format` — Auto-format files with Prettier

---

## 🏗️ About this Scaffold

This project was generated using the **[@ifecodes/backend-template](https://www.npmjs.com/package/@ifecodes/backend-template)** scaffold. You can recreate or customize this scaffold using the CLI:

- **Run without installing (recommended)**:
  ```bash
  npx ifecodes-template
  ```
- **Install globally**:
  ```bash
  npm i -g @ifecodes/backend-template
  ifecodes-template
  ```

---

## 📄 License

[ISC](LICENSE)
