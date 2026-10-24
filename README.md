# NOXwear

Arabic storefront built with Next.js, TypeScript, Tailwind CSS, and WhatsApp checkout.

## Catalog

The five collections and seven products are maintained in `src/lib/catalog.json`.
The storefront and product APIs read that file directly, so browsing does not need
a database connection or a local SQLite file on Vercel.

## Vercel deployment

Use the Next.js framework preset and `npm run build`.

Orders must be saved before checkout opens WhatsApp. Connect a **private** Vercel
Blob store to this project for Production and Preview. The connection supplies
`BLOB_READ_WRITE_TOKEN`, or `BLOB_STORE_ID` together with Vercel's short-lived OIDC
runtime credentials. Both authentication methods are supported.

Each order is stored as a private JSON document under `orders/`. Customer details
are not public, and the checkout response only returns the order ID. No
`DATABASE_URL` is required on Vercel. Checkout reports an error if order storage is
not configured, preserving the customer's cart.

## Local development

Use Node.js 22 or later:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. To use the existing local SQLite order storage, copy
`.env.example` to `.env`, then run `npx prisma db push`. The local database and
environment files are ignored by Git. The optional `node scripts/seed.js` command
recreates the local database's catalog and clears its existing orders.

To edit the public catalog, update `src/lib/catalog.json` and redeploy.
