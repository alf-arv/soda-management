# Soda Management Frontend

React SPA for tracking office soda consumption. 100% vibe coded.

## Prerequisites

- Node.js 18+ recommended
- npm (or another compatible package manager)

## Install

```bash
cd soda-management-frontend
npm install
```

## Development

```bash
npm run dev
```

Vite serves the app (default `http://localhost:5173`). The backend must be running for API calls to work. Because the frontend (port 5173) and backend (port 8080) run on different ports, the browser treats them as different origins. The backend's CORS configuration must allow the frontend's origin — by default it allows all origins (`*`), so this works out of the box. If you tighten the backend's `SODA_CORS_ALLOWED_ORIGINS`, make sure `http://localhost:5173` is included.

## Build for production

The backend URL is baked into the build at compile time via the `VITE_API_URL` environment variable. Set it **before** running the build.

### Targeting localhost (default)

If the backend runs on the same machine:

```bash
npm run build
```

This uses the value from `.env` (`http://localhost:8080` by default).

### Targeting a remote backend

Pass the URL inline or set it in a `.env.production` file:

```bash
VITE_API_URL=https://your-backend.example.com npm run build
```

Or create `.env.production`:

```
VITE_API_URL=https://your-backend.example.com
```

Then run `npm run build` as normal. Vite automatically picks up `.env.production` for production builds.

> **Note:** Because `VITE_API_URL` is inlined at build time, changing the backend URL always requires a rebuild.

### Preview the build locally

```bash
npm run preview
```

## Deploy

Static output is written to `dist/`. The `base` path in `vite.config.js` is set to `/saas/`, so the app expects to be served at that sub-path.

Copy the contents of `dist/` to your web server's `/saas/` directory:

```bash
cp -R dist/ /path/to/webroot/saas/
```

The build is plain static files. You can host it on:

- Any static file server (nginx, Apache, Caddy, etc.)
- Object storage + CDN (S3, CloudFront, Azure Static Web Apps, etc.)
- GitHub Pages, Netlify, Vercel, Cloudflare Pages

## Configuration summary

| Variable | Purpose | Default |
|---|---|---|
| `VITE_API_URL` | Base URL of the Spring Boot backend (no trailing slash) | `http://localhost:8080` |

Set this in `.env`, `.env.production`, or inline before `npm run build`.

## API assumptions

The client expects endpoints such as:

- `POST /api/auth/login` — body `{ username, password }`; response should include a JWT or token field (`token`, `accessToken`, etc.).
- `POST /api/user/change-password` — `{ currentPassword, newPassword }`; rotates the caller's password and returns a fresh token.
- `GET /api/soda` — stock, participants, recent activity, soda types, and per-type stock (field names are normalized in `src/api/api.js`).
- `POST /api/soda/take` — `{ username, sodaType? }`. The "Grab a cold one?" dialog now sends one tap per soda variant.
- `POST /api/soda/refill` — `{ username, quantity, cost, sodaType? }`.
- `POST /api/admin/verify` — `{ password }`.
- `GET /api/admin/users` — list all users.
- `POST/DELETE /api/admin/users` — create (`{ name, admin }`), delete by username (requires `X-Admin-Password` header).
- `PATCH /api/admin/users/{username}/stats` — `{ sodasTaken, sodasRefilled }` to override a user's counters.
- `GET/POST/DELETE /api/admin/soda-types` — list, add (`{ name, color }`), and remove configured soda variants.
- `PUT /api/admin/soda-stock` — `{ stock: { "<sodaType>": <count>, ... } }` to force-set per-type stock counts (used by the admin "Set stock counts" dialog when correcting numbers after losses or audits).

All non-`GET` `/api/admin/**` calls require the `X-Admin-Password` header in addition to the Bearer token.

If your backend uses slightly different JSON keys, extend `normalizeStatus` / `normalizeLoginResponse` in `src/api/api.js`.
