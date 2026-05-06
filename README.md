# Budget & Expense Tracker API

A local-first RESTful API for tracking personal income and expenses, built with **Node.js**, **Express**, and **TypeScript**.

The app supports two persistence providers:
- **SQLite** (default)
- **MongoDB** (optional, selected by environment)

---

## What Is This App?

This app helps you manage your personal budget by:

- **Recording transactions** — Log income and expenses with a date, amount, category, and optional note.
- **Categorizing expenses** — Every expense is classified as `needs`, `wants`, or `savings` (based on the 50/30/20 budgeting rule).
- **Weekly financial reviews** — Get an automatic summary of your current week's income, expenses, balance, and category breakdown.

Data is persisted in a local SQLite file at `~/.local/share/budget-expense-tracker/expense.db` (Linux path example).

MongoDB can be enabled without removing SQLite configuration.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://docs.docker.com/get-docker/) with Docker Compose (optional, for containerized run)

### Installation

```bash
npm install
```

### Run (Development)

```bash
npm run dev
```

### Build & Run (Production)

```bash
npm run build
npm start
```

The server starts on **http://localhost:3000** by default. Set the `PORT` environment variable to change it.

### Run With Docker Compose

Containerized runtime is provided via [docker-compose.yml](docker-compose.yml).

1. Create local docker env from template and update JWT secret:

```bash
cp .env.docker.example .env.docker
```

2. Start MongoDB mode (API + MongoDB):

```bash
docker compose up --build -d
```

3. Follow logs:

```bash
docker compose logs -f app
```

4. Stop containers:

```bash
docker compose down
```

MongoDB mode endpoints:

- API: http://localhost:3001
- Swagger UI: http://localhost:3001/docs

Optional SQLite-only profile:

```bash
docker compose --profile sqlite up --build -d app-sqlite
```

SQLite profile endpoints:

- API: http://localhost:3002
- Swagger UI: http://localhost:3002/docs

SQLite profile persists database data in Docker volume `sqlite_data`.

### Persistence Provider Configuration

Provider selection uses `DB_PROVIDER`:

- `sqlite` (default)
- `mongodb`

Supported environment variables:

- `DB_PROVIDER` → `sqlite` or `mongodb`
- `MONGODB_URI` → default `mongodb://127.0.0.1:27017`
- `MONGODB_DB_NAME` → default `budget_expense_tracker`
- `JWT_ACCESS_SECRET` → required, secret used to sign access tokens
- `ACCESS_TOKEN_TTL_MINUTES` → default `15`
- `REFRESH_TOKEN_TTL_DAYS` → default `7`
- `AUTH_RATE_LIMIT_WINDOW_MS` → default `900000` (15 minutes)
- `AUTH_RATE_LIMIT_MAX` → default `20`

Examples:

```bash
# Default (SQLite)
npm run dev

# Explicit SQLite
DB_PROVIDER=sqlite npm run dev

# MongoDB
DB_PROVIDER=mongodb MONGODB_URI=mongodb://127.0.0.1:27017 MONGODB_DB_NAME=budget_expense_tracker npm run dev
```

Example with auth settings:

```bash
JWT_ACCESS_SECRET=please-change-this-secret \
ACCESS_TOKEN_TTL_MINUTES=15 \
REFRESH_TOKEN_TTL_DAYS=7 \
AUTH_RATE_LIMIT_WINDOW_MS=900000 \
AUTH_RATE_LIMIT_MAX=20 \
npm run dev
```

### API Documentation (Swagger)

- Swagger UI: `http://localhost:3001/docs`
- OpenAPI JSON: `http://localhost:3001/openapi.json`

### Authentication

Public auth endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`

Protected endpoint:

- `GET /auth/me`

All business endpoints (`/transactions`, `/summary/*`, `/budgets/*`, `/awareness/*`, `/exports/*`) require:

```http
Authorization: Bearer <access_token>
```

Data isolation rules:

- Business data is private per authenticated user.
- The API does not accept `userId` in request payloads or query to scope business data.
- User scope is always derived from the bearer token on the server.
- Legacy rows without ownership (`user_id`/`userId` is null or missing) are intentionally hidden from authenticated business endpoints (Option A policy).
- New business writes always use authenticated ownership and are stored with user ownership.

Example auth flow:

```bash
# Register
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "strong-pass-123"
  }'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "strong-pass-123"
  }'

# Refresh token
curl -X POST http://localhost:3001/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "<refresh_token>" }'

# Current user
curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer <access_token>"

# Logout
curl -X POST http://localhost:3001/auth/logout \
  -H "Content-Type: application/json" \
  -d '{ "refreshToken": "<refresh_token>" }'
```

### Smoke Test Commands

Run provider parity smoke tests (auth lifecycle + protected route checks):

```bash
# Run both MongoDB and SQLite smoke tests
npm run smoke:auth

# Run MongoDB-only smoke tests
npm run smoke:auth:mongodb

# Run SQLite-only smoke tests
npm run smoke:auth:sqlite
```

Smoke coverage includes multi-user isolation checks (User B cannot read User A transactions).

Note: `smoke:auth` expects MongoDB to be available on `mongodb://127.0.0.1:27017`.

---

## API Reference

### Health Check

```
GET /
```

**Response:**

```json
{ "message": "Budget & Expense Tracker API is running 🚀" }
```

---

### Transactions

Requires `Authorization: Bearer <access_token>`.
All transaction writes and reads are scoped to the authenticated user only.

#### Create a Transaction

```
POST /transactions
```

**Request Body (JSON):**

| Field      | Type     | Required                  | Description                                      |
| ---------- | -------- | ------------------------- | ------------------------------------------------ |
| `date`     | `string` | ✅ Yes                     | Date in `YYYY-MM-DD` format                      |
| `type`     | `string` | ✅ Yes                     | `"income"` or `"expense"`                        |
| `amount`   | `number` | ✅ Yes                     | Must be greater than 0                           |
| `category` | `string` | ✅ Yes (for expenses)      | `"needs"`, `"wants"`, or `"savings"`             |
| `note`     | `string` | ❌ No                      | Optional description                             |

If `type` is `income`, any `category` value in the request is ignored and stored as `null`.

**Example — Add an expense:**

```bash
curl -X POST http://localhost:3001/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "date": "2026-04-14",
    "type": "expense",
    "category": "needs",
    "amount": 45.50,
    "note": "Groceries"
  }'
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-...",
    "date": "2026-04-14",
    "type": "expense",
    "category": "needs",
    "amount": 45.5,
    "note": "Groceries"
  }
}
```

**Example — Add income:**

```bash
curl -X POST http://localhost:3001/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "date": "2026-04-14",
    "type": "income",
    "amount": 3000,
    "note": "Monthly salary"
  }'
```

**Validation Error Response (400):**

```json
{
  "success": false,
  "errors": [
    "date is required and must be a string (YYYY-MM-DD)",
    "amount is required and must be a number greater than 0"
  ]
}
```

---

#### Get All Transactions

```
GET /transactions
```

**Example:**

```bash
curl http://localhost:3001/transactions \
  -H "Authorization: Bearer <access_token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-...",
      "date": "2026-04-14",
      "type": "expense",
      "category": "needs",
      "amount": 45.5,
      "note": "Groceries"
    },
    {
      "id": "e5f6g7h8-...",
      "date": "2026-04-14",
      "type": "income",
      "amount": 3000,
      "note": "Monthly salary"
    }
  ]
}
```

---

### Weekly Review

#### Get Current Week Summary

```
GET /summary/weekly
```

Returns a summary of all transactions from the current week (Monday–Sunday), including total income, total expenses, balance, and a breakdown of expenses by category.
The summary is computed only from the authenticated user's transactions.

**Example:**

```bash
curl http://localhost:3001/summary/weekly \
  -H "Authorization: Bearer <access_token>"
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "weekStart": "2026-04-13",
    "weekEnd": "2026-04-19",
    "totalIncome": 3000,
    "totalExpenses": 45.5,
    "balance": 2954.5,
    "categoryBreakdown": {
      "needs": 45.5,
      "wants": 0,
      "savings": 0
    },
    "transactionCount": 2
  }
}
```

---

### Budget Control (New)

All budget limits, checks, and insights are user-specific and isolated per authenticated account.

Set your default limits so you can ask before spending:

- `needs`: **500000**
- `wants`: **300000**
- `savings`: **200000**

Supported periods: `weekly`, `monthly`.

#### Set Limit

```
PUT /budgets/:period
```

Example:

```bash
curl -X PUT http://localhost:3001/budgets/weekly \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "category": "needs",
    "limitAmount": 500000
  }'
```

#### Get Budget Overview

```
GET /budgets/:period
```

Example:

```bash
curl http://localhost:3001/budgets/weekly \
  -H "Authorization: Bearer <access_token>"
```

#### Check Before Buying (Do I still have budget?)

```
POST /budgets/check
```

Example:

```bash
curl -X POST http://localhost:3001/budgets/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <access_token>" \
  -d '{
    "period": "weekly",
    "category": "wants",
    "plannedAmount": 75000
  }'
```

Possible response messages:

- `✅ You still have budget`
- `⚠️ Budget exceeded for this category`

#### Basic Insights (Quick Answer)

```
GET /budgets/insights/:period
```

Example:

```bash
curl http://localhost:3001/budgets/insights/weekly \
  -H "Authorization: Bearer <access_token>"
```

Example response lines:

```text
Needs: 450000 / 500000
Wants: 350000 / 300000 ⚠️
Savings: 200000 / 200000 ✅
```

This gives instant visibility into overspending and remaining room per category.

### Financial Awareness (Decision-Making)

Instead of only tracking, this endpoint gives direct monthly insights:

- Am I spending more than last month?
- What is my top spending category?
- What is my savings rate (%)?

Insights are calculated only from the authenticated user's data.

```
GET /awareness/monthly
```

Example:

```bash
curl http://localhost:3001/awareness/monthly \
  -H "Authorization: Bearer <access_token>"
```

Typical output:

```text
Trend: spending more than last month
Top category: wants
Savings rate: 25%
```

### Export Features (CSV & Excel)

Exports contain only transactions owned by the authenticated user.

Use one canonical endpoint:

```
GET /exports/transactions
```

Optional query params:

- `format` (`csv` or `xlsx`) — when provided, returns file download directly
- `startDate` (YYYY-MM-DD)
- `endDate` (YYYY-MM-DD)
- `type` (`income` or `expense`)
- `category` (`needs`, `wants`, `savings`)

#### 1) Get download links (JSON response)

Example:

```bash
curl "http://localhost:3001/exports/transactions?type=expense&category=needs" \
  -H "Authorization: Bearer <access_token>"
```

Response contains both download URLs:

- `data.downloads.csv.url`
- `data.downloads.xlsx.url`

#### 2) Download CSV directly

```bash
curl -L "http://localhost:3001/exports/transactions?format=csv&startDate=2026-04-01&endDate=2026-04-30" \
  -H "Authorization: Bearer <access_token>" \
  -o transactions.csv
```

#### 3) Download XLSX directly

```bash
curl -L "http://localhost:3001/exports/transactions?format=xlsx&type=expense" \
  -H "Authorization: Bearer <access_token>" \
  -o transactions.xlsx
```

---

## Project Structure

```
src/
├── application/
│   ├── dto/                         # Application-level DTO definitions
│   └── use-cases/                   # Business use-cases (transaction, budget, awareness, export)
├── domain/
│   ├── entities/                    # Core business entities/types
│   └── repositories/                # Repository contracts (interfaces)
├── infrastructure/
│   ├── config/                      # SQLite/Mongo provider config + Swagger
│   ├── database/
│   │   └── repositories/            # SQLite + Mongo adapters implementing domain repositories
│   ├── http/
│       ├── controllers/             # HTTP controllers
│       ├── middleware/              # Auth middleware and auth rate limiting
│       └── routes/                  # Route registration
│   └── security/                    # Token and password security services
├── main/
│   ├── container.ts                 # Composition root / dependency wiring
│   └── server.ts                    # Entrypoint / process bootstrap
├── shared/
│   ├── errors/                      # Shared error types
│   └── validation/                  # Shared validation helpers
└── types/                           # Project-wide type namespace
```

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 5
- **Language:** TypeScript
- **Database:** SQLite (`better-sqlite3`) and MongoDB (`mongodb`)
- **API Docs:** Swagger (`swagger-ui-express`, `swagger-jsdoc`)
- **Excel Export:** `exceljs`
- **Auth:** `argon2`, `jsonwebtoken`
