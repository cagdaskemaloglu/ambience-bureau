import { notFound } from 'next/navigation'

// Tanımsız her /[locale]/... yolu markalı 404'e (../not-found.tsx) düşsün
// diye — next-intl'in önerdiği "catch-all" kalıbı. Bu olmadan Next.js
// kendi beyaz, markasız 404'ünü gösteriyordu.
export default function CatchAllPage() {
  notFound()
}
