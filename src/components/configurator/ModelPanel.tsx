'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { useConfiguratorStore } from '@/lib/store/configurator'
import { getLocalizedValue, formatPrice } from '@/lib/sanity'
import { MaterialPicker } from './MaterialPicker'

/**
 * "Montajlı model" koleksiyonlarının seçim paneli (sarkıt, aplik, masa
 * lambası). Taban/Gövde/Başlık sekmeleri yerine:
 *   1) Model seçimi (her zaman görünür; tek model varsa otomatik seçili gelir).
 *   2) Seçili modelin renk seçilebilen HER parçası için ayrı satır:
 *      parça adı ve renkleri. Parça sayısı modelden modele değişebilir.
 * Sabit parçalar (kablo vb.) listelenmez; 3D'de otomatik görünür.
 */
export function ModelPanel({ mobile = false }: { mobile?: boolean }) {
  const locale = useLocale()
  const tr = locale === 'tr'
  const models = useConfiguratorStore((s) => s.models)
  const modelId = useConfiguratorStore((s) => s.modelId)
  const body = useConfiguratorStore((s) => s.body)
  const availableParts = useConfiguratorStore((s) => s.availableParts)
  const selectModel = useConfiguratorStore((s) => s.selectModel)
  const selectMaterial = useConfiguratorStore((s) => s.selectMaterial)
  // Model seçiliyken model ızgarası daralır (seçili model + "Değiştir"),
  // böylece parça renkleri kaydırmadan görünür. Seçim yokken açık gelir.
  const [pickerOpen, setPickerOpen] = useState(false)
  const showGrid = pickerOpen || !modelId
  const selectedModel = models.find((x) => x.modelId === modelId)

  const currency = tr ? 'TRY' : 'USD'
  const intlLocale = tr ? 'tr-TR' : 'en-US'
  const label = mobile
    ? 'font-mono text-[9.5px] uppercase tracking-widest text-bureau-muted'
    : 'font-mono text-[10.5px] uppercase tracking-wide text-bureau-muted'

  if (models.length === 0) {
    return (
      <div className="border border-dashed border-bureau-rule p-3 text-center">
        <span className="font-mono text-[10.5px] uppercase text-bureau-subtle">
          {tr ? 'Bu koleksiyonda henüz model yok.' : 'No models in this collection yet.'}
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Tek model olsa da gösterilir: ziyaretçi hangi ürünü düzenlediğini görsün. */}
      {models.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className={label}>{tr ? 'Model' : 'Model'}</span>
            {modelId && models.length > 1 ? (
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                aria-expanded={showGrid}
                className="focus-bureau font-mono text-[9.5px] uppercase tracking-wide text-bureau-amber hover:underline"
              >
                {showGrid
                  ? tr ? 'Kapat ▴' : 'Close ▴'
                  : tr ? `Modeli değiştir (${models.length}) ▾` : `Change model (${models.length}) ▾`}
              </button>
            ) : (
              <span className="font-mono text-[9.5px] text-bureau-subtle">
                {models.length} {tr ? 'model' : 'models'}
              </span>
            )}
          </div>
          {!showGrid && selectedModel && (
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="focus-bureau flex w-full items-center gap-2.5 border border-bureau-amber p-1.5 text-left"
            >
              <div className="h-12 w-12 flex-shrink-0 overflow-hidden bg-bureau-surface">
                {(selectedModel.images?.[0] ?? selectedModel.thumbnail) && (
                  <Image
                    src={(selectedModel.images?.[0] ?? selectedModel.thumbnail) as string}
                    alt=""
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <span className="min-w-0 flex-1 truncate font-mono text-[11px] uppercase tracking-wide text-bureau-black">
                {getLocalizedValue(selectedModel.name, locale, selectedModel.modelId)}
              </span>
            </button>
          )}
          {showGrid && (
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={tr ? 'Model seçimi' : 'Model selection'}>
            {models.map((m) => {
              const name = getLocalizedValue(m.name, locale, m.modelId) ?? m.modelId
              const active = m.modelId === modelId
              return (
                <button
                  key={m.modelId}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => {
                    selectModel(m.modelId)
                    setPickerOpen(false)
                  }}
                  title={name}
                  className={`focus-bureau flex w-[100px] flex-col items-stretch border p-1 text-left transition-colors ${
                    active ? 'border-bureau-amber' : 'border-bureau-rule hover:border-bureau-black'
                  }`}
                >
                  <div className="flex h-14 w-full items-center justify-center overflow-hidden bg-bureau-surface">
                    {(m.images?.[0] ?? m.thumbnail) ? (
                      <Image src={(m.images?.[0] ?? m.thumbnail) as string} alt={name} width={96} height={56} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-mono text-[8px] uppercase text-bureau-subtle">
                        {m.parts.filter((p) => !p.isFixed).length} {tr ? 'renkli parça' : 'color parts'}
                      </span>
                    )}
                  </div>
                  <span className="mt-1 line-clamp-2 font-mono text-[9px] uppercase leading-tight tracking-wide text-bureau-black">
                    {name}
                  </span>
                </button>
              )
            })}
          </div>
          )}
        </div>
      )}

      {(() => {
        const m = models.find((x) => x.modelId === modelId)
        const imgs = m?.images?.length ? m.images : m?.thumbnail ? [m.thumbnail] : []
        return m && imgs.length > 0 ? (
          <ModelGallery images={imgs} name={getLocalizedValue(m.name, locale, m.modelId) ?? m.modelId} tr={tr} />
        ) : null
      })()}

      {!modelId ? (
        <p className="border border-dashed border-bureau-rule p-3 text-center font-mono text-[10.5px] uppercase text-bureau-subtle">
          {tr ? 'Renkleri seçmek için bir model seçin.' : 'Select a model to choose its colors.'}
        </p>
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className={label}>
              {(() => {
                const m = models.find((x) => x.modelId === modelId)
                const n = m ? getLocalizedValue(m.name, locale, m.modelId) : null
                return n ? `${n} — ${tr ? 'parça renkleri' : 'part colors'}` : tr ? 'Parça renkleri' : 'Part colors'
              })()}
            </span>
            <span className="font-mono text-[9.5px] text-bureau-subtle">
              {body.length} {tr ? 'parça' : body.length === 1 ? 'part' : 'parts'}
            </span>
          </div>
          <div className="space-y-1.5">
            {body.map((slot, idx) => {
              const part = availableParts.find((p) => p.partId === slot.partId)
              if (!part) return null
              const partName = getLocalizedValue(part.name, locale, part.partId) ?? part.partId
              const price = (tr ? part.basePriceTRY : part.basePriceUSD) ?? 0
              return (
                <div key={`${modelId}-${idx}`} className="border border-bureau-rule p-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-mono text-[10.5px] uppercase tracking-wide text-bureau-black">
                      <span className="text-bureau-subtle">{String(idx + 1).padStart(2, '0')} · </span>
                      {partName}
                    </span>
                    {price > 0 && (
                      <span className="flex-shrink-0 font-mono text-[9.5px] text-bureau-subtle">
                        {formatPrice(price, currency, intlLocale)}
                      </span>
                    )}
                  </div>
                  <MaterialPicker
                    part={part}
                    selectedMaterialId={slot.materialId}
                    onSelectMaterial={(materialId) => selectMaterial('body', materialId, idx)}
                    compact
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Seçili modelin görselleri: küçük resim şeridi + tıklanınca tam ekran
 * görüntüleyici (ok tuşları / Esc, arka plana tıklayınca kapanır).
 */
function ModelGallery({ images, name, tr }: { images: string[]; name: string; tr: boolean }) {
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen((i) => (i === null ? i : (i + 1) % images.length))
      if (e.key === 'ArrowLeft') setOpen((i) => (i === null ? i : (i - 1 + images.length) % images.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, images.length])

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {images.map((src, i) => (
          <button
            key={src + i}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={`${name} — ${tr ? 'görsel' : 'image'} ${i + 1}`}
            className="focus-bureau h-16 w-16 flex-shrink-0 overflow-hidden border border-bureau-rule bg-bureau-surface transition-colors hover:border-bureau-amber"
          >
            <Image src={src} alt="" width={64} height={64} className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={name}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setOpen(null)}
        >
          <div className="relative h-full max-h-[85vh] w-full max-w-[1100px]" onClick={(e) => e.stopPropagation()}>
            <Image src={images[open]} alt={`${name} ${open + 1}`} fill sizes="100vw" className="object-contain" />
          </div>
          <span className="absolute left-4 top-4 font-mono text-[11px] uppercase tracking-widest text-white/80">
            {name} · {String(open + 1).padStart(2, '0')}/{String(images.length).padStart(2, '0')}
          </span>
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label={tr ? 'Kapat' : 'Close'}
            className="absolute right-4 top-3 px-2 py-1 font-mono text-[20px] text-white/80 hover:text-white"
          >
            ✕
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setOpen((open - 1 + images.length) % images.length)
                }}
                aria-label={tr ? 'Önceki' : 'Previous'}
                className="absolute left-3 top-1/2 -translate-y-1/2 px-3 py-2 font-mono text-[24px] text-white/80 hover:text-white"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setOpen((open + 1) % images.length)
                }}
                aria-label={tr ? 'Sonraki' : 'Next'}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-2 font-mono text-[24px] text-white/80 hover:text-white"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
