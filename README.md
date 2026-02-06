# Warexo API Playground

Interactive graphical tool for exploring and testing the **Warexo ERP System API**. Built with React, Tailwind CSS, and an Express CORS proxy.

## Features

- **Environment Manager** – Save multiple API connections (Dev, Staging, Prod) and switch between them instantly. Import/Export as JSON.
- **Authentication** – Login with username/password, automatic JWT token refresh on expiry.
- **Client Selector** – After login, choose which client to work with (`X-Client-Id` header).
- **Entity Browser** – Browse all 325+ entities from the Warexo ERP, grouped by bundle, with full column and relation metadata.
- **Relation Tree Picker** – Navigate entity relations by clicking through the tree to build dot-notation field paths (e.g. `categories.title`, `vendorproducts.vendor.title`).
- **Request Builder** – Full CRUD support:
  - `GET /entity/{type}` – List entities with field selection, limit, offset
  - `GET /entity/{type}/{id}` – Fetch single entity
  - `POST /searchentity/{type}` – Advanced search with filters and operators
  - `POST /entity/{type}` – Create entities (single or bulk)
  - `PATCH /entity/{type}/{id}` – Update entities
  - `DELETE /entity/{type}/{id}` – Delete entities
- **Filter Builder** – Visual filter construction with operators (EQ, CONTAINS, STARTSWITH, GT, LT, ISNULL, etc.)
- **Response Viewer** – Syntax-highlighted JSON with collapsible nodes, headers view, status/duration/size info.
- **Request History** – Per-environment history with favorites/bookmarks.
- **cURL Preview** – Copy-paste ready cURL commands for every request.
- **Electron-ready** – Architecture prepared for packaging as a standalone desktop app.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+ installed
- Access credentials for a Warexo ERP instance

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

This starts both the Express proxy server (port 3001) and the Vite dev server (port 5173). Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

Builds the React app and serves it via the Express proxy server.

### Setup

1. Click the environment selector in the top bar and create a new environment
2. Enter your Warexo API URL (e.g. `https://your-instance.warexo.com`), username, and password
3. Click **Connect** to authenticate
4. Select a client from the dropdown (if multiple clients are available)
5. Choose an entity from the sidebar and start building requests

## Architecture

```
├── docs/examples/        ← IntelliJ HTTP Client examples (legacy)
├── electron/             ← Electron main process (desktop app)
│   └── main.js
├── server/               ← Express CORS proxy
│   └── index.js
├── src/                  ← React application
│   ├── components/       ← UI components
│   ├── contexts/         ← React Context providers (Auth, Environment, Entity)
│   └── utils/            ← API client, entity utilities, storage helpers
├── package.json
├── vite.config.js
└── index.html
```

### CORS Proxy

The Express proxy server solves CORS issues by forwarding API requests. Each request includes an `X-Target-Url` header specifying the target Warexo instance, allowing multiple environments without server restarts.

### Entity Metadata

Entity definitions (columns, relations, types) are loaded from [warexo.github.io/entity-docs](https://warexo.github.io/entity-docs/data/entities.json) at startup. This enables the field picker, relation tree navigation, and type hints in the request builder.

## IntelliJ HTTP Client Examples

The original HTTP Client request files are preserved in `docs/examples/` for users who prefer the IntelliJ/PhpStorm HTTP Client workflow. See the files there for simple request templates.

## Roadmap

- [ ] **Grid Explorer** – UI for `/api/v1/grid/{id}/{page}`: paginated list views with sorting and search fields
- [ ] **Form Renderer** – UI for `/api/v1/renderform/{form}/{entity}/{grid}`: render declarative ERP forms as interactive input masks
- [ ] **Electron Packaging** – Build and distribute as a standalone desktop application

## License

MIT
