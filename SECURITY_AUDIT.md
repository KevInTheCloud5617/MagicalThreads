# MagicalThreads Security Audit

**Date:** 2026-03-29  
**Auditor:** Pal (automated)  
**Scope:** Full application — site (port 53000), admin (port 53001), Docker infrastructure

---

## 🔴 CRITICAL

### 1. All Site Admin API Routes Have ZERO Authentication

**Files:**
- `site/src/app/api/admin/products/route.ts` (GET, POST, PUT, DELETE)
- `site/src/app/api/admin/products/[id]/route.ts` (GET, PUT, DELETE)
- `site/src/app/api/admin/orders/route.ts` (GET, PUT)
- `site/src/app/api/admin/inquiries/route.ts` (GET, POST, PUT)
- `site/src/app/api/admin/upload/route.ts` (POST)

**Description:** None of these routes call `isAdminAuthenticated()` or any other auth check. The function exists in `site/src/lib/admin-auth.ts` but is **never imported or used** in any API route. Anyone on the internet can:
- Create, modify, or delete any product
- View all orders (with customer data) and change order status
- View all customer inquiries (names, emails, messages)
- Upload arbitrary images to Azure Blob Storage
- Delete the entire product catalog

**Evidence:** `grep -rn "isAdminAuthenticated" site/src/app/api/` returns zero results.

**Fix:** Add auth middleware to every admin route:
```typescript
import { isAdminAuthenticated } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ... rest of handler
}
```
Or better: create a wrapper/middleware that protects all `/api/admin/*` routes.

---

### 2. Admin Auth Token is a Static Hardcoded String

**File:** `site/src/lib/admin-auth.ts`

```typescript
const ADMIN_TOKEN = "authenticated";
```

**Description:** The admin session cookie value is the literal string `"authenticated"`. Anyone who sets `mt_admin_session=authenticated` in their browser cookies bypasses auth entirely. There's no session ID, no HMAC, no server-side session store.

**Fix:** Use a cryptographically signed token (e.g., JWT with a secret, or a random session ID stored server-side). At minimum, use a HMAC of the password + a secret.

---

### 3. Admin Password is Weak and Committed to Source

**File:** `.env` (root), `site/.env`

```
ADMIN_PASSWORD=magical2024
```

**Description:** The admin password `magical2024` is trivially guessable and is committed directly to the repo's `.env` files (not just `.env.example`).

**Fix:** 
- Use a strong random password (20+ chars)
- Add `.env` to `.gitignore` and remove from git history
- Rotate the password immediately

---

### 4. Azure Storage Account Key Exposed in Source Files

**Files:** `.env`, `site/.env`, `admin/.env`

**Description:** The full Azure Storage connection string including the **account key** is committed to multiple `.env` files in the repo. This grants full read/write/delete access to the entire storage account (all containers, all blobs, queues, tables, file shares).

```
AccountKey=[REDACTED]
```

**Fix:**
- Rotate the Azure Storage account key **immediately**
- Remove `.env` files from git history (`git filter-branch` or `bfg`)
- Use Azure Managed Identity or SAS tokens with minimal permissions instead of account keys
- Pass secrets via environment variables in deployment (not committed files)

---

### 5. Admin Portal (port 53001) Has No Authentication Layer

**File:** `admin/src/app/api/products/route.ts`, `admin/src/app/api/orders/route.ts`, `admin/src/app/api/inquiries/route.ts`

**Description:** The admin app on port 53001 has zero authentication on any route. The `auth.ts` file only extracts a name from Cloudflare Access headers — it doesn't enforce access. All admin API endpoints (products CRUD, orders, inquiries) are completely open.

The comment in `admin/src/lib/auth.ts` says "Returns null if no auth info available (local dev)" — suggesting it relies entirely on Cloudflare Access as a network-level gate. If the Cloudflare tunnel is misconfigured or port 53001 is exposed directly, the entire admin is open.

**Fix:** Add application-level auth as defense in depth. Never rely solely on network-level access control.

---

## 🟠 HIGH

### 6. No Auth on Site Middleware for Admin API Routes

**File:** `site/src/middleware.ts`

```typescript
if (path.startsWith("/api/admin")) return NextResponse.next();
```

**Description:** The middleware explicitly allows all `/api/admin` routes through with no auth check. Combined with Finding #1, this means admin APIs are fully public.

**Fix:** Check the admin session cookie in middleware for all `/api/admin/*` routes.

---

### 7. File Upload — MIME Type Only Validation (No Magic Bytes)

**Files:** `admin/src/app/api/upload/route.ts`, `site/src/app/api/admin/upload/route.ts`

```typescript
const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
if (!allowed.includes(file.type)) { ... }
```

**Description:** File type is validated only by the `file.type` property (client-provided MIME type), which is trivially spoofable. An attacker can upload any file (HTML, SVG with XSS, executable) by setting the MIME header to `image/jpeg`.

**Fix:** Validate file magic bytes (file signature) server-side. For example, check the first bytes: `FF D8 FF` for JPEG, `89 50 4E 47` for PNG.

---

### 8. File Upload — Extension from User-Controlled Filename

**Files:** `admin/src/app/api/upload/route.ts:28`, `site/src/app/api/admin/upload/route.ts:30`

```typescript
const ext = file.name.split(".").pop() || "jpg";
const blobName = `${sku}/${randomUUID()}.${ext}`;
```

**Description:** The file extension is taken directly from the user-uploaded filename. An attacker could upload `evil.html` or `evil.svg` — the blob would be stored with that extension and served with the spoofed content type, enabling stored XSS via Azure Blob Storage URLs.

**Fix:** Derive the extension from the validated (magic-byte-checked) content type, not the filename.

---

### 9. SKU Parameter in Upload Not Sanitized for Path Traversal

**Files:** `admin/src/app/api/upload/route.ts`, `site/src/app/api/admin/upload/route.ts`

```typescript
const blobName = `${sku}/${randomUUID()}.${ext}`;
```

**Description:** The `sku` parameter is used directly in the blob path with no sanitization. A value like `../../other-container` could potentially manipulate the storage path (though Azure Blob Storage may limit this, it's still bad practice).

**Fix:** Sanitize `sku` to alphanumeric + hyphens only: `sku.replace(/[^a-zA-Z0-9-]/g, '')`

---

### 10. No Input Validation on Product/Order/Inquiry Mutations

**Files:** All admin API routes (both site and admin apps)

**Description:** No schema validation on any POST/PUT request body. Examples:
- Product price can be set to negative, zero, or non-numeric
- Product name can be empty or contain arbitrary HTML
- Order status can be set to any arbitrary string
- No field length limits

**Fix:** Use Zod (already a dependency) for request body validation on all mutation endpoints.

---

### 11. Checkout Doesn't Validate Quantity

**File:** `site/src/app/api/checkout/route.ts`

```typescript
quantity: item.quantity,
```

**Description:** While prices are correctly looked up server-side (good!), the quantity is passed directly from the client with no validation. A negative or zero quantity could cause issues with Stripe, or a very large quantity could be used for abuse.

**Fix:** Validate `item.quantity` is a positive integer (1-99 or similar reasonable max).

---

## 🟡 MEDIUM

### 12. No CSRF Protection

**Description:** The admin auth uses a cookie (`mt_admin_session`) with `sameSite: "lax"`. While `lax` prevents CSRF on POST from cross-origin forms in most cases, there's no CSRF token implementation. GET requests that modify state (there are none currently, but it's a gap) would be vulnerable.

**Fix:** Consider adding CSRF tokens for defense in depth, or ensure all mutations use POST/PUT/DELETE (which `sameSite: lax` protects).

---

### 13. No Rate Limiting on Any Endpoint

**Description:** No rate limiting exists on:
- Admin login (`/api/admin/auth`) — allows unlimited password brute-force
- Checkout (`/api/checkout`) — allows abuse
- Inquiry submission (`/api/admin/inquiries` POST) — allows spam
- File upload — allows storage exhaustion

**Fix:** Add rate limiting via middleware or a service like Cloudflare rate limiting rules.

---

### 14. No CSP (Content-Security-Policy) Headers

**Files:** `site/next.config.ts`, `admin/next.config.ts`

**Description:** Neither Next.js config sets Content-Security-Policy headers. This makes XSS exploitation easier if any vector exists.

**Fix:** Add CSP headers in `next.config.ts`:
```typescript
headers: async () => [{ source: '/(.*)', headers: [{ key: 'Content-Security-Policy', value: "default-src 'self'; ..." }] }]
```

---

### 15. No CORS Configuration

**Description:** No explicit CORS headers are set. Next.js API routes default to same-origin, but this should be explicitly configured to prevent unintended cross-origin access.

**Fix:** Add explicit CORS headers or use Next.js middleware to set them.

---

### 16. Container Runs as Root

**File:** `Dockerfile`

**Description:** The production container uses `node:22-alpine` without switching to a non-root user. Both Node.js processes run as root inside the container.

**Fix:** Add to Dockerfile before ENTRYPOINT:
```dockerfile
RUN addgroup -S app && adduser -S app -G app
USER app
```

---

### 17. Error Messages May Leak Internal Details

**Files:** Upload routes, checkout route

```typescript
const message = err instanceof Error ? err.message : "Upload failed";
return NextResponse.json({ error: message }, { status: 500 });
```

**Description:** Raw error messages from Azure SDK or Prisma are returned to the client, potentially leaking internal infrastructure details (connection strings, table names, etc.).

**Fix:** Log the full error server-side but return a generic error message to the client.

---

## 🟢 LOW

### 18. `--accept-data-loss` Flag in Entrypoint

**File:** `deploy/entrypoint.sh`

```bash
npx prisma db push --skip-generate --accept-data-loss 2>/dev/null || true
```

**Description:** This could silently drop columns/data during schema changes. Not a security issue per se, but a data integrity risk.

**Fix:** Use `prisma migrate deploy` for production, or remove `--accept-data-loss`.

---

### 19. Stripe Secret Key Fallback to Empty String

**File:** `site/src/lib/stripe.ts`

```typescript
_stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { ... });
```

**Description:** If `STRIPE_SECRET_KEY` is missing, Stripe is initialized with an empty string rather than failing fast. This could lead to confusing errors.

**Fix:** Throw an explicit error if the key is missing in production.

---

### 20. No `dangerouslySetInnerHTML` Found ✅

No instances of `dangerouslySetInnerHTML` were found in the application source code. This is good — no obvious XSS vectors in rendered templates.

---

### 21. npm Audit — Moderate Vulnerabilities

Both `site` and `admin` have:
- **high:** `@prisma/config` via `effect` (transitive, fix requires prisma major version bump)
- **moderate:** `brace-expansion` DoS vulnerability

**Fix:** Run `npm audit fix` or update Prisma when v7 is stable.

---

## Summary

| Severity | Count | Key Issues |
|----------|-------|------------|
| 🔴 CRITICAL | 5 | All admin APIs unauthenticated, static auth token, secrets in source |
| 🟠 HIGH | 6 | Upload validation bypass, no input validation, quantity not checked |
| 🟡 MEDIUM | 6 | No CSRF, no rate limiting, no CSP, container as root |
| 🟢 LOW | 4 | Minor hardening, dependency updates |

### Priority Actions (do these NOW):
1. **Add auth checks to ALL `/api/admin/*` routes on the site app** — this is the most critical issue
2. **Replace the static auth token** with a cryptographically secure session mechanism
3. **Rotate the Azure Storage account key** — it's compromised via source control
4. **Change the admin password** to something strong
5. **Remove `.env` files from git** and add to `.gitignore`
