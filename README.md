# Ciyora Jewels

Professional static storefront and admin dashboard for Ciyora Jewels.

## Architecture

- Static storefront: `index.html` plus `assets/`
- Admin dashboard: `admin.html` plus `assets/`
- Cloudflare Pages Functions: `functions/api/`
- Cloudflare D1 schema and demo catalog: `migrations/0001_initial.sql`
- Secure admin users and sessions: D1 `admin_users` and `sessions` tables
- Catalog reads and writes: JSON API under `/api`

The storefront reads published products from `/api/catalog`. The dashboard reads and writes the full catalog through authenticated endpoints. Data is no longer stored in browser `localStorage`.

## Local preview

A plain static server can still preview the visual pages, but it cannot execute the `/api` Functions. For the real full-stack preview, use Wrangler after configuring a D1 binding:

```powershell
npx wrangler pages dev . --d1=DB=ciyora-jewels
```

Then open `http://localhost:8788/` and `http://localhost:8788/admin.html`.

## Cloudflare deployment

1. Create a D1 database:

```powershell
npx wrangler d1 create ciyora-jewels
```

2. Copy the returned database id into `wrangler.toml` in place of `REPLACE_WITH_YOUR_D1_DATABASE_ID`.

3. Apply the schema and demo catalog locally first, then remotely:

```powershell
npx wrangler d1 migrations apply ciyora-jewels --local
npx wrangler d1 migrations apply ciyora-jewels --remote
```

4. Create the first admin user locally. The script writes only a salted PBKDF2 hash to `admin-user.sql`, never the plaintext password:

```powershell
node scripts/create-admin.mjs --email admin@ciyorajewels.com --name "Ciyora Admin"
npx wrangler d1 execute ciyora-jewels --remote --file=admin-user.sql
Remove-Item admin-user.sql
```

5. Deploy with Wrangler or connect this repository to Cloudflare Pages. For Wrangler:

```powershell
npx wrangler pages project create ciyora-jewels
npx wrangler pages deploy . --project-name=ciyora-jewels
```

Cloudflare Pages detects the `functions/` directory and uses the D1 binding named `DB` from `wrangler.toml`. The production site must use HTTPS so the session cookie is Secure.

## Security notes

- Passwords are never stored in the browser or in source control.
- Passwords are hashed with PBKDF2-HMAC-SHA-256 and a random per-user salt.
- Sessions are random, database-backed, expire after seven days, and use HttpOnly/SameSite cookies.
- Admin mutations require a valid session and same-origin request.
- Delete `admin-user.sql` immediately after applying it.
- The current image picker stores image URLs/data URLs in the catalog. For a larger production catalog, move original image files to Cloudflare R2 or an image CDN and store only their URLs in D1.

## API routes

- `GET /api/catalog` — public published catalog
- `POST /api/auth/login` — create admin session
- `POST /api/auth/logout` — invalidate current session
- `GET /api/auth/me` — verify current session
- `POST /api/auth/password` — rotate password while signed in
- `GET|PUT /api/admin/catalog` — authenticated catalog load/replace
- `POST|PUT|DELETE /api/admin/products` — authenticated product CRUD
- `POST|PUT|DELETE /api/admin/categories` — authenticated category CRUD
- `GET|PUT /api/admin/settings` — authenticated store settings
