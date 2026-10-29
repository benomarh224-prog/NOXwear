NOXwear — Source Code
=====================

Generated: 2026-10-24T20:22:22.082Z
Files: 118
Total size: 2536.6 KB

How to run locally:
  1. Install Node.js 18+ (or Bun)
  2. Install dependencies:
       npm install
       # or: bun install
  3. Create .env file with:
       DATABASE_URL="file:./db/custom.db"
  4. Push the database schema:
       npx prisma db push
  5. Seed sample data (5 categories, 7 products):
       node scripts/seed.js
  6. Generate Prisma client:
       npx prisma generate
  7. Start the dev server:
       npm run dev
       # or: bun run dev
  8. Open http://localhost:3000

Tech stack:
  - Next.js 16 (App Router) + TypeScript
  - Prisma ORM (SQLite)
  - Tailwind CSS 4 + shadcn/ui
  - Zustand for cart state
  - Framer Motion animations
  - Cairo font for Arabic RTL support

Features:
  - 5 categories: هوديات، أنمي، رياضة، فن عربي، دروب حصرية
  - 7 products (WhatsApp-image hoodies, all at 250 DH)
  - Cart + WhatsApp checkout on +212 645-900763
  - Free shipping for all Moroccan cities
  - Full payment in cash on delivery
  - Arabic RTL interface
  - Image cards per category (cards.png style)

Contact: +212 645-900763 (WhatsApp)
Brand: NOXwear (since 2018, Casablanca)
