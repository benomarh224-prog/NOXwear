/* eslint-disable @typescript-eslint/no-require-imports */
// Seed script for NOXwear store — ONLY WhatsApp-image products (7 total)
const { PrismaClient } = require('@prisma/client')

const db = new PrismaClient()

const { categories, products } = require('../src/lib/catalog.json')

async function main() {
  console.log('🧹 Cleaning DB...')
  await db.cartItem.deleteMany()
  await db.order.deleteMany()
  await db.product.deleteMany()
  await db.category.deleteMany()

  console.log(`📦 Seeding ${categories.length} categories...`)
  for (const cat of categories) {
    await db.category.create({ data: cat })
  }

  console.log(`👕 Seeding ${products.length} products...`)
  for (const p of products) {
    const category = await db.category.findUnique({ where: { slug: p.categorySlug } })
    if (!category) throw new Error(`Category not found: ${p.categorySlug}`)
    const { categorySlug, ...rest } = p
    await db.product.create({
      data: {
        ...rest,
        gallery: rest.image,
        categoryId: category.id,
      },
    })
  }

  console.log('✅ Seed complete!')
  const counts = {
    categories: await db.category.count(),
    products: await db.product.count(),
  }
  console.log(counts)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
