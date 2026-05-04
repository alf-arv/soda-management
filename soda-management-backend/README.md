# Soda Management Backend

Spring Boot service that tracks office soda consumption and refills. State is held in memory and written to a JSON file after each change so data survives restarts (including Docker container restarts).

## Requirements

- Java 21+
- Maven 3.9+ (for local builds)

## Build

```bash
cd soda-management-backend
mvn clean package
```

The runnable JAR is `target/soda-management-backend-1.0.0-SNAPSHOT.jar`.

## Run locally

```bash
mvn spring-boot:run
```

By default the app listens on port `8080`. On first start it creates `./data` if needed when using a writable `soda.data-file` path, for example:

```bash
SODA_DATA_FILE=./data/soda-state.json mvn spring-boot:run
```

## Run with Docker

```bash
docker compose up --build
```

The API is exposed on `http://localhost:8080`. A named volume `soda-data` stores `/data/soda-state.json` inside the container.

Override environment variables as needed, for example:

```bash
SODA_ADMIN_PASSWORD=secret docker compose up --build
```

## Configuration

| Property / env | Default | Description |
|----------------|---------|-------------|
| `soda.admin-password` / `SODA_ADMIN_PASSWORD` | `admin123` | Master admin password for `/api/admin/*` operations (with admin user + header) and for the initial `admin` user password on first run |
| `soda.data-file` / `SODA_DATA_FILE` | `/data/soda-state.json` | JSON persistence path |
| `soda.initial-stock` / `SODA_INITIAL_STOCK` | `0` | Starting stock when no state file exists yet |
| `soda.cors.allowed-origins` / `SODA_CORS_ALLOWED_ORIGINS` | `*` | Comma-separated origins, or `*` for all (pattern) |

YAML keys use kebab-case; environment variables use the `SODA_*` form above (Spring Boot relaxed binding).

## First-time bootstrap

If no state file exists, the service seeds:

- Stock: `soda.initial-stock`
- User `admin` with password equal to `soda.admin-password` and role `ADMIN`

## Authentication

1. `POST /api/auth/login` with `{ "username", "password" }` — returns user stats and a `token`.
2. For protected routes, send `Authorization: Bearer <token>` where `<token>` is Base64 (`username:password`).
3. Every non-`GET` `/api/admin/**` route additionally requires the `X-Admin-Password` header to match `soda.admin-password` (the SHA-256 hash of the master password, as produced by the frontend).

`POST /api/admin/verify` is public and only checks the master password in the JSON body.

## API overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | none | Login; returns token |
| POST | `/api/user/change-password` | Bearer | `{ "currentPassword", "newPassword" }` — rotates the caller's password and returns a fresh token |
| GET | `/api/soda` | Bearer | Dashboard: stock, users (no passwords), recent events, soda types, per-type stock |
| POST | `/api/soda/take` | Bearer | `{ "username", "sodaType"? }` — must match token user; logs one soda and decrements per-type stock |
| POST | `/api/soda/refill` | Bearer | `{ "username", "quantity", "cost", "sodaType"? }` — user must match token; adds to per-type stock |
| POST | `/api/admin/verify` | none | `{ "password" }` — checks master password |
| GET | `/api/admin/users` | Bearer | All users (no passwords) |
| POST | `/api/admin/users` | Bearer + `X-Admin-Password` | `{ "name", "admin" }` — creates user, returns generated password |
| DELETE | `/api/admin/users/{username}` | Bearer + `X-Admin-Password` | Removes user (cannot delete `admin`) |
| PATCH | `/api/admin/users/{username}/stats` | Bearer + `X-Admin-Password` | `{ "sodasTaken", "sodasRefilled" }` — overrides a user's counters |
| GET | `/api/admin/soda-types` | Bearer | Lists configured soda variants (`name`, `color`) |
| POST | `/api/admin/soda-types` | Bearer + `X-Admin-Password` | `{ "name", "color" }` — adds a new soda variant with `0` initial stock |
| DELETE | `/api/admin/soda-types/{name}` | Bearer + `X-Admin-Password` | Removes a soda variant and its stock entry |
| PUT | `/api/admin/soda-stock` | Bearer + `X-Admin-Password` | `{ "stock": { "<sodaType>": <count>, ... } }` — force-sets per-type stock counts (e.g. corrections after losses); omitted types are left untouched |

Typical HTTP statuses: `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`.

Recent events kept for the dashboard: last **50** entries.

## CORS

Browsers block frontend JavaScript from calling a backend on a different origin (different host, port, or scheme) unless the backend explicitly allows it via CORS headers.

By default `SODA_CORS_ALLOWED_ORIGINS` is `*`, which permits requests from any origin. To lock it down, set it to a comma-separated list of the origins that should be allowed:

```bash
SODA_CORS_ALLOWED_ORIGINS=https://mysite.com,http://localhost:5173
```
