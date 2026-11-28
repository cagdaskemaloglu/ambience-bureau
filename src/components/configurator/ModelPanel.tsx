'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import { useConfiguratorStore } from '@/lib/store/configurator'
import { getLocalizedValue, formatPrice } from '@/lib/sanity'
import type { LampPart } from '@/types'

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
      {/* Masaüstü: modeller her zaman görünür, yana kayan tek şerit. */}
      {!mobile && (
        <section>
          <StepHead n={1} title={tr ? 'Model' : 'Model'} aside={`${String(models.length).padStart(2, '0')} ${tr ? 'model' : models.length === 1 ? 'model' : 'models'}`} />
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label={tr ? 'Model seçimi' : 'Model selection'}>
            {models.map((m) => {
              const name = getLocalizedValue(m.name, locale, m.modelId) ?? m.modelId
              const active = m.modelId === modelId
              const img = m.images?.[0] ?? m.thumbnail
              return (
                <button
                  key={m.modelId}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => selectModel(m.modelId)}
                  title={name}
                  className={`focus-bureau group relative flex w-[104px] flex-shrink-0 flex-col border text-left transition-colors ${
                    active ? 'border-bureau-amber bg-bureau-amber/5' : 'border-bureau-rule hover:border-bureau-black'
                  }`}
                >
                  <span className="flex h-[72px] w-full items-center justify-center overflow-hidden bg-bureau-surface">
                    {img ? (
                      <Image src={img} alt="" width={104} height={72} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <span className="font-mono text-[8px] uppercase text-bureau-subtle">
                        {m.parts.filter((p) => !p.isFixed).length} {tr ? 'renkli parça' : 'color parts'}
                      </span>
                    )}
                  </span>
                  <span className={`line-clamp-2 px-1.5 py-1.5 font-mono text-[9.5px] uppercase leading-tight tracking-wide ${active ? 'text-bureau-amber' : 'text-bureau-black'}`}>
                    {name}
                  </span>
                  {active && (
                    <span aria-hidden="true" className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center bg-bureau-amber font-mono text-[9px] text-white">
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </section>
      )}

      {/* Tek model olsa da gösterilir: ziyaretçi hangi ürünü düzenlediğini görsün. */}
      {mobile && models.length > 0 && (
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
        <section>
          <StepHead
            n={mobile ? null : 2}
            title={tr ? 'Parça renkleri' : 'Part colours'}
            aside={`${String(body.length).padStart(2, '0')} ${tr ? 'parça' : body.length === 1 ? 'part' : 'parts'}`}
          />
          <ApplyAll />
          <ol className="mt-2 space-y-1.5">
            {body.map((slot, idx) => {
              const part = availableParts.find((p) => p.partId === slot.partId)
              if (!part) return null
              const partName = getLocalizedValue(part.name, locale, part.partId) ?? part.partId
              const price = (tr ? part.basePriceTRY : part.basePriceUSD) ?? 0
              const mat = part.materials.find((x) => x.materialId === slot.materialId)
              const matName = mat ? getLocalizedValue(mat.label, locale, mat.materialId) : ''
              const mod = mat ? (tr ? mat.priceModifierTRY : mat.priceModifierUSD) : 0
              return (
                <li key={`${modelId}-${idx}`} className="border border-bureau-rule p-2.5 transition-colors hover:border-bureau-black">
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="h-5 w-5 flex-shrink-0 rounded-full border border-bureau-black/30"
                      style={{ backgroundColor: mat?.color }}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold tracking-[-0.01em] text-bureau-black">
                        <span className="mr-1.5 font-mono text-[10px] font-normal text-bureau-subtle">{String(idx + 1).padStart(2, '0')}</span>
                        {partName}
                      </span>
                      <span className="block truncate font-mono text-[9.5px] uppercase tracking-wide text-bureau-muted">
                        {matName}
                        {mod > 0 && <> · +{formatPrice(mod, currency, intlLocale)}</>}
                      </span>
                    </span>
                    {price > 0 && (
                      <span className="flex-shrink-0 font-mono text-[10px] tabular-nums text-bureau-subtle">
                        {formatPrice(price, currency, intlLocale)}
                      </span>
                    )}
                  </div>
                  <Swatches
                    materials={part.materials}
                    selected={slot.materialId}
                    onSelect={(materialId) => selectMaterial('body', materialId, idx)}
                    locale={locale}
                  />
                </li>
              )
            })}
          </ol>
        </section>
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

/** Numaralı adım başlığı: "01  Model ............ 02 model". */
function StepHead({ n, title, aside }: { n: number | null; title: string; aside?: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-2.5">
      {n !== null && (
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center bg-bureau-black font-mono text-[10px] text-bureau-white">
          {String(n).padStart(2, '0')}
        </span>
      )}
      <span className="text-[14px] font-semibold tracking-[-0.01em] text-bureau-black">{title}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-bureau-rule" />
      {aside && <span className="font-mono text-[9.5px] uppercase tabular-nums tracking-wider text-bureau-subtle">{aside}</span>}
    </div>
  )
}

type Mat = LampPart['materials'][number]

/** Büyük renk daireleri; seçili olanda halka + onay işareti. */
function Swatches({
  materials,
  selected,
  onSelect,
  locale,
}: {
  materials: Mat[]
  selected: string | null
  onSelect: (materialId: string) => void
  locale: string
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup">
      {materials.map((m) => {
        const on = m.materialId === selected
        const label = getLocalizedValue(m.label, locale, m.materialId) ?? m.materialId
        return (
          <button
            key={m.materialId}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onSelect(m.materialId)}
            title={label}
            aria-label={label}
            className={`focus-bureau relative flex h-7 w-7 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 ${
              on ? 'border-bureau-amber ring-2 ring-bureau-amber/30' : 'border-bureau-rule hover:border-bureau-black'
            }`}
            style={{ backgroundColor: m.color }}
          >
            {on && (
              <span aria-hidden="true" className="font-mono text-[11px] font-bold text-white [text-shadow:0_0_3px_rgba(0,0,0,0.8)]">
                ✓
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * "Tek renk": seçilen rengi, o rengi sunan TÜM parçalara tek tıkla uygular
 * (renk, hex koduna göre eşleşir). Parça parça uğraşmadan tek tonlu lamba.
 */
function ApplyAll() {
  const locale = useLocale()
  const tr = locale === 'tr'
  const body = useConfiguratorStore((s) => s.body)
  const availableParts = useConfiguratorStore((s) => s.availableParts)
  const selectMaterial = useConfiguratorStore((s) => s.selectMaterial)

  const parts = body.map((slot) => availableParts.find((p) => p.partId === slot.partId))
  if (parts.filter(Boolean).length < 2) return null
  const byColor = new Map<string, Mat>()
  for (const p of parts) for (const m of p?.materials ?? []) {
    const k = m.color.toLowerCase()
    if (!byColor.has(k)) byColor.set(k, m)
  }
  const colors = [...byColor.entries()]
  if (colors.length < 2) return null
  const allSame = (hex: string) =>
    body.every((slot, i) => {
      const p = parts[i]
      if (!p) return true
      const cur = p.materials.find((m) => m.materialId === slot.materialId)
      const has = p.materials.some((m) => m.color.toLowerCase() === hex)
      return !has || cur?.color.toLowerCase() === hex
    })

  return (
    <div className="flex items-center gap-2.5 border border-dashed border-bureau-rule px-2.5 py-2">
      <span className="flex-shrink-0 font-mono text-[9.5px] uppercase leading-tight tracking-wide text-bureau-muted">
        {tr ? 'Tek renk' : 'One colour'}
        <span className="block text-bureau-subtle">{tr ? 'hepsine uygula' : 'apply to all'}</span>
      </span>
      <div className="flex flex-wrap gap-1">
        {colors.map(([hex, m]) => {
          const label = getLocalizedValue(m.label, locale, m.materialId) ?? hex
          const on = allSame(hex)
          return (
            <button
              key={hex}
              type="button"
              title={label}
              aria-label={`${label} — ${tr ? 'tüm parçalara uygula' : 'apply to all parts'}`}
              aria-pressed={on}
              onClick={() =>
                body.forEach((_, i) => {
                  const match = parts[i]?.materials.find((x) => x.color.toLowerCase() === hex)
                  if (match) selectMaterial('body', match.materialId, i)
                })
              }
              className={`focus-bureau h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 ${on ? 'border-bureau-amber' : 'border-bureau-rule'}`}
              style={{ backgroundColor: m.color }}
            />
          )
        })}
      </div>
    </div>
  )
}
