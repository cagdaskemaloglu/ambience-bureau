'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import { useRouter, usePathname } from '@/i18n/navigation'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

const CATEGORIES = [
  { value: undefined, key: 'allObjects' as const },
  { value: 'pendant', key: 'pendant' as const },
  { value: 'wall', key: 'wall' as const },
  { value: 'desk', key: 'desk' as const },
  { value: 'floor', key: 'floor' as const },
  { value: 'strip', key: 'strip' as const },
]

const STATUS_OPTIONS = [
  { value: 'certified', key: 'certified' },
  { value: 'limited', key: 'limited' },
  { value: 'decommissioned', key: 'decommissioned' },
] as const

const PHOTON_OPTIONS = [
  { value: '2700K', label: '2700K' },
  { value: '2700K-6500K', label: '2700K – 6500K' },
  { value: '6500K', label: '6500K' },
] as const

const COMPATIBILITY_OPTIONS = [
  { value: 'app', key: 'app', label: 'App Protocol' },
  { value: 'voice', key: 'voice', label: 'Voice Module' },
  { value: 'manual', key: 'manual', label: 'Manual Override' },
  { value: 'schedule', key: 'schedule', label: 'Schedule Automation' },
] as const

type AccordionKey = 'collection' | 'photon' | 'compatibility' | 'price'

function SidebarContent({
  objectCount,
  onClose,
}: {
  objectCount: number
  onClose?: () => void
}) {
  const t = useTranslations('registry')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [openAccordions, setOpenAccordions] = useState<Set<AccordionKey>>(new Set())

  const activeCategory = searchParams.get('category')
  const activeStatus = searchParams.get('status')
  const activePhoton = searchParams.get('photon')
  const activeCompat = searchParams.get('compat')

  function updateParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === undefined || params.get(key) === value) {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    const query = params.toString()
    router.push(`${pathname}${query ? `?${query}` : ''}`)
    onClose?.()
  }

  function toggleAccordion(key: AccordionKey) {
    setOpenAccordions((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto px-7 py-9">
      <div className="label-mono mb-2.5">{t('section')}</div>
      <h1 className="mb-5 border-b border-dashed border-bureau-rule pb-3.5 text-[28px] font-light uppercase tracking-wide">
        {t('title')}
      </h1>

      {/* Category filter */}
      <div className="mb-1">
        <h3 className="mb-3 text-[10.5px] uppercase tracking-wide">{t('filters.category')}</h3>
        <ul className="flex flex-col gap-2.5">
          {CATEGORIES.map(({ value, key }) => {
            const isActive = value === undefined ? !activeCategory : activeCategory === value
            return (
              <li key={key ?? 'all'}>
                <button
                  onClick={() => updateParam('category', value)}
                  className={`text-left text-[12px] transition-opacity ${
                    isActive ? 'font-semibold text-bureau-black' : 'text-bureau-black opacity-75 hover:opacity-100'
                  }`}
                >
                  {t(`filters.${key}` as never)}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Status accordion */}
      <div className="mt-7 border-t border-bureau-black pt-4">
        <button
          onClick={() => toggleAccordion('collection')}
          className="flex w-full items-center justify-between py-1 font-mono text-[11px] uppercase tracking-wide"
        >
          {t('filters.status')}
          <span className="text-bureau-subtle">{openAccordions.has('collection') ? '−' : '+'}</span>
        </button>
        {openAccordions.has('collection') && (
          <ul className="mt-3 flex flex-col gap-2.5 pb-2">
            {STATUS_OPTIONS.map(({ value, key }) => (
              <li key={key}>
                <button
                  onClick={() => updateParam('status', value)}
                  className={`text-left text-[12px] ${activeStatus === value ? 'font-semibold' : 'opacity-75 hover:opacity-100'}`}
                >
                  {t(`filters.${key}` as never)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Photon output accordion */}
      <div className="mt-4 border-t border-bureau-black pt-4">
        <button
          onClick={() => toggleAccordion('photon')}
          className="flex w-full items-center justify-between py-1 font-mono text-[11px] uppercase tracking-wide"
        >
          {t('filters.photonOutput')}
          <span className="text-bureau-subtle">{openAccordions.has('photon') ? '−' : '+'}</span>
        </button>
        {openAccordions.has('photon') && (
          <ul className="mt-3 flex flex-col gap-2.5 pb-2">
            {PHOTON_OPTIONS.map(({ value, label }) => (
              <li key={value}>
                <button
                  onClick={() => updateParam('photon', value)}
                  className={`text-left text-[12px] ${activePhoton === value ? 'font-semibold' : 'opacity-75 hover:opacity-100'}`}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Compatibility accordion */}
      <div className="mt-4 border-t border-bureau-black pt-4">
        <button
          onClick={() => toggleAccordion('compatibility')}
          className="flex w-full items-center justify-between py-1 font-mono text-[11px] uppercase tracking-wide"
        >
          {t('filters.compatibility')}
          <span className="text-bureau-subtle">{openAccordions.has('compatibility') ? '−' : '+'}</span>
        </button>
        {openAccordions.has('compatibility') && (
          <ul className="mt-3 flex flex-col gap-2.5 pb-2">
            {COMPATIBILITY_OPTIONS.map(({ value, label }) => (
              <li key={value}>
                <button
                  onClick={() => updateParam('compat', value)}
                  className={`text-left text-[12px] ${activeCompat === value ? 'font-semibold' : 'opacity-75 hover:opacity-100'}`}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Price accordion */}
      <div className="mb-7 mt-4 border-t border-bureau-black pt-4">
        <button
          onClick={() => toggleAccordion('price')}
          className="flex w-full items-center justify-between py-1 font-mono text-[11px] uppercase tracking-wide"
        >
          {t('filters.valuation')}
          <span className="text-bureau-subtle">{openAccordions.has('price') ? '−' : '+'}</span>
        </button>
        {openAccordions.has('price') && (
          <ul className="mt-3 flex flex-col gap-2.5 pb-2">
            {[
              { value: '0-5000', label: '< ₺5.000' },
              { value: '5000-10000', label: '₺5.000 – ₺10.000' },
              { value: '10000-', label: '> ₺10.000' },
            ].map(({ value, label }) => (
              <li key={value}>
                <button
                  onClick={() => updateParam('price', value)}
                  className="text-left text-[12px] opacity-75 hover:opacity-100"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Custom Registry CTA */}
      <div className="border border-bureau-black p-4">
        <div className="label-mono mb-2 text-bureau-amber">{t('cta.formRef')}</div>
        <p className="mb-3 text-[12px] leading-relaxed">{t('cta.text')}</p>
        <Link href="/custom-registry" className="btn-bureau w-full text-center" onClick={onClose}>
          {t('cta.button')}
        </Link>
      </div>

      <div className="mt-5 font-mono text-[10px] tracking-wide text-bureau-subtle">
        {objectCount} {objectCount === 1 ? 'OBJECT' : 'OBJECTS'} ON RECORD
      </div>
    </div>
  )
}

export function Sidebar({ objectCount }: { objectCount: number }) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Drawer açıkken body scroll'u kilitle
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  return (
    <>
      {/* Desktop: sabit sidebar */}
      <aside className="hidden border-r border-bureau-black md:block">
        <SidebarContent objectCount={objectCount} />
      </aside>

      {/* Mobile: filtre butonu — ProductGrid üstünde, page.tsx'ten değil buradan render */}
      <div className="flex items-center justify-between border-b border-bureau-black px-5 py-3 md:hidden">
        <span className="font-mono text-[10px] uppercase tracking-widest text-bureau-muted">
          {objectCount} OBJECTS
        </span>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 border border-bureau-black px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider"
        >
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
            <line x1="0" y1="1" x2="14" y2="1" stroke="currentColor" strokeWidth="1.2" />
            <line x1="3" y1="5" x2="14" y2="5" stroke="currentColor" strokeWidth="1.2" />
            <line x1="6" y1="9" x2="14" y2="9" stroke="currentColor" strokeWidth="1.2" />
          </svg>
          Filtrele
        </button>
      </div>

      {/* Mobile drawer */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          {/* Panel — sağdan kayar */}
          <div className="fixed inset-y-0 right-0 z-50 w-[300px] bg-white shadow-xl md:hidden">
            {/* Drawer header */}
            <div className="flex items-center justify-between border-b border-bureau-black px-5 py-4">
              <span className="font-mono text-[11px] uppercase tracking-widest">Filtreler</span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex h-7 w-7 items-center justify-center"
                aria-label="Kapat"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <line x1="1" y1="1" x2="13" y2="13" stroke="currentColor" strokeWidth="1.5" />
                  <line x1="13" y1="1" x2="1" y2="13" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </button>
            </div>
            <SidebarContent objectCount={objectCount} onClose={() => setDrawerOpen(false)} />
          </div>
        </>
      )}
    </>
  )
}