# NOXwear

Arabic storefront built with Next.js, TypeScript, Tailwind CSS and WhatsApp checkout.

## Product administration

Open `/admin` and sign in with the owner's password. The dashboard supports adding
and editing products, prices, descriptions, categories, stock, sizes, colors,
featured status and visibility. Upload up to six photos and choose the primary
image. Additional photos appear in the product detail gallery. Hiding a product
removes it from the storefront while keeping it available in administration.
Delete moves a product to Trash; restoring returns it as hidden until explicitly
published again. Deleted records and their photos are retained for recovery.

The initial catalog is `src/lib/catalog.json`. Once the first admin save occurs,
the canonical catalog is the private Blob document `catalog/products-v1.json`.
The storefront reads it at request time, so changes require no GitHub push or
redeployment. Catalog writes use an ETag precondition to reject concurrent stale
saves instead of silently overwriting another edit.

Product images are normalized to WebP and stored separately under
`catalog/media/`. `/api/media/<uuid>.webp` serves only these product images;
catalog documents, authentication data and orders remain private.

## Vercel configuration

Use the Next.js preset and `npm run build`. Keep the existing **private** Vercel
Blob connection (`BLOB_READ_WRITE_TOKEN`, or `BLOB_STORE_ID` with OIDC).

Production admin authentication requires these server-only variables:

- `ADMIN_PASSWORD_HASH`: random salt and scrypt hash, encoded `salt:hexHash`.
- `NEXTAUTH_SECRET`: a cryptographically random session encryption key.
- `NEXTAUTH_URL`: the canonical HTTPS origin.

Only the configured owner can sign in. There is no public registration. Sessions
expire after eight hours. Login attempts are throttled in persistent private
storage; mutation routes require both an owner session and the same Origin.
Never commit passwords, `.env` files, or `.codex/admin-access.*` files.

Orders continue to be stored privately under `orders/`. No production SQLite
file or database migration is needed.

## Local development and verification

Use Node.js 22 or later, `npm ci`, then `npm run dev`.
Local catalog and image data live under ignored `.codex/store/` when Blob is not
configured. `NOX_ADMIN_LOCAL_STORAGE=1` forces local storage off Vercel, for
isolated tests; the flag is ignored on Vercel.

`npm run test:smoke` checks public catalog, images and endpoint protection against
`BASE_URL`. `npm run test:admin` checks owner login, validation, upload,
create/edit/publish/hide and concurrent saves against localhost:3100. It reads
the ignored `.codex/admin-access.json` fixture and restores the local catalog
afterward. It refuses to run mutation tests against a remote deployment.

For the legacy local SQLite order fallback, retain `DATABASE_URL` from
`.env.example`. Do not run `scripts/seed.js` against valuable data: it recreates
the old database catalog and clears orders.
