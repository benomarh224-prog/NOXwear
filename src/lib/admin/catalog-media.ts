import 'server-only'
import type { AdminProduct } from './product-schema'
import { postgresStorageEnabled, storageDatabase } from './postgres-storage'

export async function countMissingProductImages(products: AdminProduct[]) {
  if (!postgresStorageEnabled()) return 0
  const paths = [...new Set(products.filter((product) => product.active && !product.deletedAt).flatMap((product) => product.images).filter((image) => image.startsWith('/api/media/')).map((image) => 'catalog/media/' + image.slice('/api/media/'.length)))]
  if (!paths.length) return 0
  const found = await storageDatabase().query('SELECT path FROM nox_objects WHERE path = ANY($1::text[])', [paths])
  return paths.length - found.rows.length
}
