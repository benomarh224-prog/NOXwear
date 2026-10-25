import { z } from 'zod'
import seed from '@/lib/catalog.json'

export const adminCategories = seed.categories.map(({ slug, name }) => ({ slug, name }))
const categorySlugs = new Set(adminCategories.map((category) => category.slug))
const imagePath = z.string().max(300).regex(/^\/(?:products|categories|hero)\/[a-zA-Z0-9_.-]+$|^\/api\/media\/[a-f0-9-]{36}\.webp$/)
const choices = z.array(z.string().trim().min(1).max(40)).min(1).max(20)

export const productInputSchema = z.object({
  name: z.string().trim().min(2, 'دخل اسم المنتج').max(150),
  productType: z.enum(['hoodie', 'other']).default('hoodie'),
  description: z.string().trim().max(3000),
  price: z.number().finite().positive('الثمن خاصو يكون أكبر من صفر').max(100000),
  categorySlug: z.string().refine((value) => categorySlugs.has(value), 'اختار القسم'),
  images: z.array(imagePath).min(1, 'زيد صورة للمنتج').max(6),
  sizes: choices,
  colors: choices,
  stock: z.number().int().min(0).max(100000),
  featured: z.boolean(),
  active: z.boolean(),
  badge: z.string().trim().max(50),
})

export const productRecordSchema = productInputSchema.extend({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(150),
  oldPrice: z.number().nonnegative().nullable(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  tags: z.array(z.string().max(100)).max(30),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().default(null),
})

export const catalogDocumentSchema = z.object({
  version: z.literal(1),
  products: z.array(productRecordSchema).max(1000),
})

export const saveProductSchema = z.object({
  revision: z.string().min(1).max(300),
  product: productInputSchema,
})

export type ProductInput = z.infer<typeof productInputSchema>
export type AdminProduct = z.infer<typeof productRecordSchema>
export type CatalogDocument = z.infer<typeof catalogDocumentSchema>

export function initialCatalog(): CatalogDocument {
  return {
    version: 1,
    products: seed.products.map((product) => ({
      slug: product.slug,
      productType: 'hoodie' as const,
      name: product.name,
      description: product.description,
      price: product.price,
      oldPrice: null,
      images: [product.image],
      categorySlug: product.categorySlug,
      sizes: product.sizes.split(',').map((size) => size.trim()),
      colors: product.colors.split(',').map((color) => color.trim()),
      rating: product.rating,
      reviewCount: product.reviewCount,
      stock: product.stock,
      featured: product.featured,
      badge: product.badge || '',
      tags: product.tags.split(',').map((tag) => tag.trim()),
      active: true,
      deletedAt: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    })),
  }
}
