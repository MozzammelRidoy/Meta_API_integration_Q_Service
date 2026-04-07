# 🔗 Resilient Meta Ads API Integration Service

## 📌 Project Overview

This is a production-grade backend service built to demonstrate **real-world resilience patterns** when integrating with an unreliable third-party API — simulated here as the Meta Ads API.

The focus is not on Meta account setup. The goal is to showcase **how a backend system survives and recovers** from API failures, rate limits, auth errors, and network instability — all while keeping data consistent, processing asynchronous.

The service exposes three endpoints:

- `GET /api/v1/meta/ad-insights` — calls the simulated Meta API directly to observe random responses
- `POST /api/v1/insights/sync-insights` — triggers asynchronous ad insights sync jobs
- `GET /api/v1/insights` — fetches stored insights from the database with filtering and pagination

---

## 🛠️ Tech Stack

| Layer               | Technology                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Runtime             | Node.js                                                                                                                                          |
| Framework           | Express.js _(via [`create-express-new-project`](https://www.npmjs.com/package/create-express-new-project) — my own backend scaffolding package)_ |
| Language            | TypeScript                                                                                                                                       |
| Database            | PostgreSQL                                                                                                                                       |
| ORM                 | Prisma                                                                                                                                           |
| Queue               | BullMQ                                                                                                                                           |
| Cache / Queue Store | Redis (ioredis)                                                                                                                                  |
| Validation          | Zod                                                                                                                                              |
| Package Manager     | NPM                                                                                                                                              |

> **Note on framework choice:** I used Express.js bootstrapped with my own package **`create-express-new-project`** — an NPM package I built and published myself for rapid, opinionated backend project setup. It generates the full project structure (routing, error handling, middleware, Prisma, TypeScript config) in one command within 2s. This is intentional — the architecture and patterns are production-standard regardless of the framework.

---

## 🏗️ System Architecture

The project follows a clean **modular layered architecture**:

```
Request
  └─▶ Router
        └─▶ Middleware (Validation / Zod)
              └─▶ Controller
                    └─▶ Service
                          └─▶ BullMQ Queue  ──▶  Redis (job stored)
                                                      │
                                              BullMQ Worker (async)
                                                      │
                                              Meta API (simulated)
                                                      │
                                           ┌──────────┴──────────┐
                                      Success                  Failure
                                           │                      │
                                    PostgreSQL upsert        Retry logic
                                           │                  (backoff)
                                    Job removed from Redis
```

### Key Layers

- **Router** — Defines API endpoints and wires middleware + controller
- **Middleware** — Zod schema validation on request body before hitting business logic
- **Controller** — Thin layer; receives request, delegates to service, sends response
- **Service** — Enqueues one BullMQ job per `campaign_id`. Returns immediately — all processing is async
- **BullMQ Queue** — Holds jobs in Redis; each job carries `{ campaign_id, date }`
- **BullMQ Worker** — Consumes jobs, calls the simulated Meta API, handles all error scenarios, writes to DB
- **Redis** — BullMQ job store
- **PostgreSQL** — Final store for all successfully synced ad insights

---

## ✨ Features

### ✅ Simulated Meta API

A mock function that deliberately behaves like a real unreliable external API:

- **60%** of calls succeed (HTTP 200/202/203)
- **20%** return a rate limit error (HTTP 429)
- **20%** return random errors: 400, 401, 403, 404, 500, 502, 503, 504

### ✅ Async Queue Processing (BullMQ + Redis)

- Sync requests return immediately with job IDs — the caller is never blocked
- Each `campaign_id` becomes one independent job
- Workers process up to 5 jobs in parallel (concurrency: 5)

### ✅ Retry with Exponential Backoff

- Failed jobs are automatically retried up to **5 attempts**
- Backoff: 3s → 6s → 12s → 24s → 48s
- Separate handling per error type (see Business Logic below)

### ✅ Idempotency — No Duplicate Data

- Job-level: deterministic `jobId: insights:{campaign_id}:{date}` prevents duplicate jobs from the same POST call
- DB-level: Prisma `upsert` on `@@unique([campaign_id, date])` ensures re-processed jobs update rather than duplicate

### ✅ Clean Job Lifecycle

- Completed jobs are **removed from Redis immediately** (`removeOnComplete: true`)
- Failed jobs are retained for debugging (last 50)

### ✅ Startup Safety

- Redis credentials are verified with a PING before the server starts
- If Redis auth fails, the server exits cleanly
- The BullMQ worker only initializes after Redis is confirmed healthy

### ✅ Dynamic Query + Pagination

- `GET /insights` supports filtering by `campaign_id`, `date`, `impressions`, `clicks`, `spend`
- Supports sorting, field selection, and cursor-based pagination

---

## ⚙️ Setup & Installation

1. **Clone the repository**

```bash
git clone https://github.com/MozzammelRidoy/Meta_API_integration_Q_Service
cd meta_api_integration_q_service
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

A `.env` file is already included in the project with all defaults pre-filled. You only need to update **two values**:

```env
# Your PostgreSQL connection string
POSTGRESQL_DATABASE_URL="postgresql://user:password@localhost:5432/meta_api_integration_db?schema=public"

# Your Redis connection URL (local or cloud)
RADIS_CACHE_DB_URL=redis://localhost:6379
```

> For cloud Redis with a password: `redis://default:your_password@your-redis-host:port`

4. **Run database migrations**

```bash
npx prisma migrate dev --name init
```

5. **Start the development server**

```bash
npm run dev
```

> Redis and PostgreSQL must be running before starting the server. If Redis credentials are wrong, the server will log the error and exit cleanly — it will not start.

---

## 📝 Documentation

### 📮 Postman Collection

Import and test all APIs directly:
👉 [Download Postman Collection](https://drive.google.com/file/d/1erY-2VVzMmPTgXCovFyFwE40t8iMZGBI/view?usp=drive_link)

---

### 🗄️ Database Schema

```prisma
model AdInsights {
  id          String   @id @default(uuid())
  campaign_id String
  impressions Int
  clicks      Int
  spend       Float
  date        DateTime

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  isDeleted   Boolean  @default(false)

  @@unique([campaign_id, date])   // idempotency guard
  @@index([campaign_id])          // fast lookup by campaign
  @@index([date])                 // fast lookup by date range

  @@map("ad_insights")
}
```

**Design decisions:**

- `@@unique([campaign_id, date])` — one record per campaign per day; upsert is safe to call multiple times
- `@@index([campaign_id])` and `@@index([date])` — common query patterns are indexed
- `isDeleted` — soft delete support built in
- `spend` as `Float` — Meta returns decimal spend values (e.g. `$124.50`)

---

### 🔌 API Endpoints

#### `GET /api/v1/meta/ad-insights`

Calls the simulated Meta API directly. Use this to observe the random response behavior — success, rate limit, auth errors, server errors — without triggering the full queue pipeline.

**Query Parameters (all optional — defaults are used if omitted):**

| Param         | Type   | Example                                | Description               |
| ------------- | ------ | -------------------------------------- | ------------------------- |
| `campaign_id` | string | `9c3c3279-5820-4f32-9d70-e17bcdf006f2` | Campaign ID to simulate   |
| `date`        | string | `2026-04-07`                           | Date in YYYY-MM-DD format |

**Example request:**

```
GET /api/v1/meta/ad-insights?campaign_id=9c3c3279-5820-4f32-9d70-e17bcdf006f2&date=2026-04-07
```

**Possible responses (random on every call):**

Success (60% chance):

```json
{
  "status": 200,
  "success": true,
  "message": "Ad insights fetched successfully from Meta API",
  "data": {
    "campaign_id": "9c3c3279-5820-4f32-9d70-e17bcdf006f2",
    "impressions": 27485,
    "clicks": 843,
    "spend": 312.75,
    "date": "2026-04-07"
  }
}
```

Rate limit error (20% chance):

```json
{
  "status": 429,
  "success": false,
  "message": "Meta API rate limit exceeded. Please retry after some time."
}
```

Random error (20% chance — one of: 400, 401, 403, 404, 500, 502, 503, 504):

```json
{
  "status": 503,
  "success": false,
  "message": "Meta API error: Service Unavailable"
}
```

---

#### `POST /api/v1/insights/sync-insights`

Triggers async sync jobs for one or more campaigns on a given date.

**Request Body:**

```json
{
  "campaign_ids": ["camp_001", "camp_002", "camp_003"],
  "date": "2024-12-01"
}
```

**Response (202 — returned immediately, processing is async):**

```json
{
  "success": true,
  "message": "Ad Insights Store Data stored successfully",
  "data": {
    "queued": 3,
    "date": "2024-12-01",
    "campaign_ids": ["camp_001", "camp_002", "camp_003"],
    "jobIds": [
      "insights:camp_001:2024-12-01",
      "insights:camp_002:2024-12-01",
      "insights:camp_003:2024-12-01"
    ]
  }
}
```

---

#### `GET /api/v1/insights`

Fetches stored insights from the database with full dynamic query support.

**Example request with all options:**

```
GET /api/v1/insights?limit=2&page=2&id=9c3c3279-5820-4f32-9d70-e17bcdf006f2&fields=campaign_id,impressions&sort=-spend
```

**This endpoint is fully dynamic** — filter, sort, and shape the response using any field.

**Query Parameters:**

| Param     | Type   | Example                                                       | Description                                                                               |
| --------- | ------ | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| any field | —      | `id`, `campaign_id`, `impressions`, `clicks`, `spend`, `date` | Filter by **any model field** — pass field name as query key with the value to match      |
| `page`    | number | `2`                                                           | Page number (default: 1)                                                                  |
| `limit`   | number | `2`                                                           | Records per page (default: 10)                                                            |
| `sort`    | string | `-spend` or `clicks`                                          | Sort by **any field**; prefix with `-` for descending, no prefix for ascending            |
| `fields`  | string | `campaign_id,impressions`                                     | Return **only the specified fields** — any unlisted fields are excluded from the response |

**Example response:**

```json
{
  "success": true,
  "message": "Ad Insights Store Data fetched successfully",
  "data": [
    { "campaign_id": "camp_001", "impressions": 42000 },
    { "campaign_id": "camp_002", "impressions": 31500 }
  ],
  "meta": {
    "page": 2,
    "limit": 2,
    "totalData": 18,
    "totalPage": 9
  }
}
```

---

### 🧠 Business Logic — Behind the Scenes

This is the core of what the project demonstrates. Every decision is driven by real-world thinking about **unreliable external APIs**.

#### How a sync job flows end-to-end:

1. `POST /sync-insights` is received with a list of `campaign_ids` and a `date`
2. The service creates **one BullMQ job per campaign_id** — each is independent, isolated, and tracked separately
3. Jobs get a **deterministic `jobId`**: `insights:{campaign_id}:{date}` — if the same POST is sent twice, BullMQ recognises the ID already exists and skips the duplicate enqueue
4. The HTTP response returns immediately with job IDs — the client is not blocked
5. The BullMQ Worker picks up each job and calls the simulated Meta API

#### What happens based on the Meta API response:

| HTTP Status     | Meaning                  | Action                                                                                                 |
| --------------- | ------------------------ | ------------------------------------------------------------------------------------------------------ |
| 200 / 202 / 203 | Success                  | Upsert to DB → Job complete & removed from Redis                                                       |
| 429             | Rate Limited             | Throw → BullMQ retries with exponential backoff (up to 5 attempts)                                     |
| 401 / 403       | Unauthorized / Forbidden | Retry all 5 attempts with backoff. If all fail → **re-queue with 5 min delay** for auth recovery       |
| 404             | Not Found                | Return silently (job marked complete, no store, no retry) — this campaign simply doesn't exist in Meta |
| 5xx / other     | Server Error             | Throw → BullMQ retries with exponential backoff                                                        |

#### Why 404 is treated differently from 401/403:

- **404** means the campaign does not exist in Meta's database. Retrying is pointless — the answer will always be 404. The job is closed permanently.
- **401/403** means the data exists but access is currently blocked (expired token, revoked permission). This is a **temporary** state — once auth is restored, the job should be retried. That is why after exhausting all 5 attempts, the job is **automatically re-queued with a 5 minute delay** rather than discarded.

#### Idempotency at two levels:

- **Queue level** — deterministic `jobId` prevents the same job from being added twice
- **Database level** — Prisma `upsert` on `@@unique([campaign_id, date])` means even if a job runs twice (e.g. after re-queue), the DB ends up with exactly one record per campaign per day, updated with the latest values

---

## ⚖️ Design Decisions & Tradeoffs

| Decision                             | Reason                                                                                       |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| One job per `campaign_id`            | Failures are isolated — one bad campaign doesn't block others                                |
| Deterministic `jobId`                | Idempotency at the queue level with no extra DB check                                        |
| `removeOnComplete: true`             | Completed jobs are cleaned from Redis immediately — no stale data                            |
| Auth errors re-queued, not discarded | 401/403 are temporary — data exists, access will be restored                                 |
| 404 silently completes the job       | Campaign doesn't exist — retrying wastes resources                                           |
| `lazyConnect` on shared Redis client | Prevents auto-connect on module load; startup ping validates credentials before server opens |
| Prisma upsert over insert            | Same job can safely run multiple times without duplicate rows                                |
| concurrency: 5                       | Parallel processing without overwhelming the Meta API mock                                   |

---

## 👤 Author

**Mozzammel Ridoy**

- GitHub: [@MozzammelRidoy](https://github.com/MozzammelRidoy)
- Package: [`create-express-new-project`](https://www.npmjs.com/package/create-express-new-project)
