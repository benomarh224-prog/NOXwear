# Free storage

NOXwear uses its dedicated Prisma Postgres Free database when `NOX_DATABASE_URL_POOLED`
or `NOX_DATABASE_URL` is configured. These variables are server-only and are created
by the Vercel Marketplace integration with the `NOX` prefix. The database is connected
to Production. Local verification still uses `.codex/store` when
`NOX_ADMIN_LOCAL_STORAGE=1` and `VERCEL` is unset.

The selected Marketplace plan is `free`: 2 GB shared storage and 100K monthly
operations as reported by the integration on 2026-11-05. It requires no payment
method. Free plans have limits; reaching them can suspend database operations.
Do not change the integration plan to a paid tier without the owner's approval.

## Schema and privacy

Apply `migrations/001-free-storage.sql` before deploying with the new variables.
`npm run storage:setup` uses the server-only environment or the ignored local file
`.codex/free-storage-production.env`. It creates tables without deleting existing
objects. Never commit or print connection strings or this environment file.

`nox_objects` holds private JSON and media bytes, keyed by the same paths as the
old storage. JSON saves use a conditional SQL update on the revision so concurrent
edits cannot overwrite one another. All SQL values are parameterized. Images and
customer designs retain their existing UUID routes. Video uploads use 2 MiB owner-
authenticated chunks and a transactional final assembly, with a 50 MiB limit.

Only validated media paths are public. Catalogue documents, login rate limits,
customer details and orders have no public download route. Public catalogue reads
are cached briefly; owner changes invalidate that cache and checkout reads current
data directly.

## Recovery on 2026-11-05

The original Blob store is suspended for exceeding its free quota. It was not
removed or rewritten. The latest available public snapshot recovered 83 published
products from 2026-11-05, retaining prices, choices, manual order and image URLs.
This snapshot does not include hidden/deleted products, historical orders or old
analytics. Those remain in the original store until it permits export again.

77 products still reference a primary photo in that original store; six use local
repository assets. Missing media displays an unavailable-image icon rather than
an unrelated hoodie. The owner can upload original photos in `/admin`, hide an
unready product, or wait for the original provider to allow reads again. The media
reader retries legacy access with a short backoff and copies readable original
files into the new database. The one legacy video also retains its URL for recovery.

## Verification

- `npm run test:postgres-storage`: real SQL persistence, revision conflicts, binary
  media, chunked video assembly, seeking and cancellation. It cleans up only its
  uniquely named test objects.
- `npm run test:admin`, `test:video`, `test:custom-print`: run with local storage;
  never point these mutation suites at the Production database.
