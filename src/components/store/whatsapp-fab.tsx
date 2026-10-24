'use client'

import { MessageCircle } from 'lucide-react'

const WHATSAPP_NUMBER = '212645900763'

export function WhatsAppFab() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('مرحبا NOXwear، عندي سؤال على منتج')}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل عبر واتساب"
      className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xl shadow-emerald-600/40 hover:bg-emerald-700 hover:scale-110 transition-all group"
    >
      <MessageCircle className="h-7 w-7" />
      {/* Pulsing ring */}
      <span className="absolute inset-0 rounded-full bg-emerald-600 animate-ping opacity-30" />
      {/* Tooltip */}
      <span className="absolute right-full mr-3 whitespace-nowrap bg-card text-foreground text-xs font-medium px-3 py-1.5 rounded-md border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
        تواصل معنا على واتساب
      </span>
    </a>
  )
}
