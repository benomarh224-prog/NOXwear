'use client'

import { useEffect } from 'react'
import { initializeNavigation, useUI } from '@/lib/ui-store'
import { useCart } from '@/lib/store'
import { Header } from './header'
import { Marquee } from './marquee'
import { Hero } from './hero'
import { CategoriesSection } from './categories-section'
import { CategoryHighlight } from './category-highlight'
import { FeaturedProducts } from './featured-products'
import { DropsBanner } from './drops-banner'
import { Footer } from './footer'
import { CartDrawer } from './cart-drawer'
import { SearchDialog } from './search-dialog'
import { CategoryView } from './category-view'
import { ProductDetail } from './product-detail'
import { CheckoutView } from './checkout-view'
import { SuccessView } from './success-view'
import { SearchView } from './search-view'
import { WhatsAppFab } from './whatsapp-fab'
import type { Category, Product } from '@/lib/types'

interface StoreAppProps {
  categories: Category[]
  products: Product[]
  featured: Product[]
  highlights: Record<string, Product>
  heroImage: string
  accentImage: string
}

export function StoreApp({
  categories,
  products,
  featured,
  highlights,
  heroImage,
  accentImage,
}: StoreAppProps) {
  const view = useUI((s) => s.view)

  useEffect(() => initializeNavigation(), [])
  useEffect(() => { useCart.getState().syncCatalog(products) }, [products])

  const renderView = () => {
    switch (view.kind) {
      case 'home':
        return (
          <>
            <Hero
              featuredImage={heroImage}
              accentImage={accentImage}
              categoryCount={categories.length}
              productCount={products.length}
            />
            <CategoriesSection categories={categories} />
            <CategoryHighlight categories={categories} highlights={highlights} />
            <FeaturedProducts products={featured} />
            <DropsBanner />
          </>
        )
      case 'category': {
        const cat = categories.find((c) => c.slug === view.slug)
        if (!cat) return <NotFound />
        return <CategoryView key={cat.slug} category={cat} products={products} />
      }
      case 'product': {
        const product = products.find((item) => item.slug === view.slug)
        if (!product) return <NotFound />
        const related = products
          .filter((item) => item.categoryId === product.categoryId && item.slug !== product.slug)
          .slice(0, 4)
        return <ProductDetail key={view.slug} product={product} related={related} />
      }
      case 'search':
        return <SearchView key={view.query} query={view.query} products={products} />
      case 'checkout':
        return <CheckoutView />
      case 'success':
        return <SuccessView orderId={view.orderId} total={view.total} whatsappUrl={view.whatsappUrl} />
      default:
        return null
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Marquee />
      <Header />
      <main className="flex-1 flex flex-col">{renderView()}</main>
      <Footer />
      <CartDrawer />
      <SearchDialog products={products} />
      <WhatsAppFab />
    </div>
  )
}

function NotFound() {
  const setView = useUI((s) => s.setView)
  return (
    <div className="flex-1 flex items-center justify-center py-32 text-center">
      <div>
        <p className="text-6xl font-black gradient-text-gold mb-4">404</p>
        <p className="font-semibold">الصفحة غير موجودة</p>
        <button
          onClick={() => setView({ kind: 'home' })}
          className="mt-4 text-gold hover:underline text-sm"
        >
          → العودة للرئيسية
        </button>
      </div>
    </div>
  )
}
