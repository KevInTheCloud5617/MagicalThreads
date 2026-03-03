# Craft Store — Next.js Storefront + Admin

A lightweight e-commerce platform built for small craft businesses. Includes a customer-facing storefront and a separate admin dashboard, backed by SQLite and Stripe.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** SQLite via Prisma
- **Payments:** Stripe
- **Styling:** Tailwind CSS
- **Monorepo:** Three packages — `site/`, `admin/`, `shared/`

## Project Structure

```
├── site/       → Customer storefront (port 3000)
├── admin/      → Admin dashboard (port 3001)
├── shared/     → Prisma schema, DB utilities, shared types
└── deploy/     → Azure Container Apps deployment (Bicep)
```

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd <repo>
npm install
```

### 2. Configure environment

Copy the example env files and fill in your values:

```bash
cp site/.env.example site/.env
cp admin/.env.example admin/.env
cp shared/.env.example shared/.env
```

Edit each `.env` with your Stripe keys, site name, domain, etc.

### 3. Set up the database

```bash
cd shared
npx prisma migrate dev
cd ..
```

### 4. Run

```bash
# In separate terminals:
cd site && npm run dev    # → http://localhost:3000
cd admin && npm run dev   # → http://localhost:3001
```

## Configuration

All branding is driven by environment variables — no code changes needed:

| Variable | Description |
|----------|-------------|
| `SITE_NAME` | Your store name |
| `SITE_URL` | Public URL of the storefront |
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `ADMIN_PASSWORD` | Password for admin access |
| `INSTAGRAM_HANDLE` | Your Instagram username |
| `CONTACT_EMAIL` | Store contact email |

Client-side variables use the `NEXT_PUBLIC_` prefix (e.g., `NEXT_PUBLIC_SITE_URL`).

## Deployment

See [`deploy/README.md`](deploy/README.md) for Azure Container Apps deployment instructions.

## License

[GPL-3.0](LICENSE)
