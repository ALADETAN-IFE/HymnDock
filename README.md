# hymn_dock_ts

A monolithic backend API application.

## Architecture

- **Type**: Monolith API
- **Port**: 4000 (default)

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Operations**: Environment validation at startup and request tracing headers
- **Features**:
  - Helmet (Security headers)
  - Morgan (HTTP logging)
- **Observability**: Request IDs and HTTP access logs
- **API Docs**: OpenAPI Swagger UI (/api-docs)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
```bash
cd hymn_dock_ts
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

## Running the Application

### Development

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## API Endpoints

Base URL: `http://localhost:4000`

- **GET** `/` - Root endpoint (API info)
- **GET** `/api/v1/health` - Health check

- **GET** `/api-docs` - Interactive Swagger UI

### Example Requests
```bash
# Root info
curl http://localhost:4000/

# Health check
curl http://localhost:4000/api/v1/health

```

## Project Structure

```
hymn_dock_ts/
├── .husky/             # Git hooks
├── src/
│   ├── config/         # Configuration files
│   ├── middlewares/    # Custom middlewares
│   ├── modules/        # Feature modules
│   │   └── v1/         # API version 1
│   │       └── health/ # Health check
│   ├── utils/          # Utility functions
│   ├── app.ts          # Express app setup
│   ├── routes.ts       # Route definitions
│   └── server.ts       # Server entry point
├── .husky/             # Git hooks
├── package.json
└── tsconfig.json
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Run Prettier

## Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `PORT` | Server port | `4000` |
| `NODE_ENV` | Environment | `development` |

## About this Scaffold

This project was generated using the @ifecodes/backend-template scaffold. You can recreate or customize this scaffold using the CLI:

- Run without installing (recommended): `npx ifecodes-template`
- Install globally: `npm i -g @ifecodes/backend-template` and run `ifecodes-template`

## License

MIT
