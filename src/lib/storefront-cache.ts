// Only public catalogue reads share this cache; admin and checkout stay fresh.
export const STOREFRONT_CACHE_TAG = 'storefront-products'

export class CatalogUnavailableError extends Error {}
