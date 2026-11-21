/**
 * Anasayfa bölüm başlığı — resmi belgedeki madde numarası (§1, §2...) +
 * başlık + kısa açıklama. Bkz. claude/DESIGN.md → "Yerleşim".
 */
export function SectionHeading({
  id,
  number,
  title,
  lede,
  meta,
}: {
  id: string
  number: string
  title: string
  lede?: string
  /** Sağ köşede gerçek bir belge verisi (adet, kod, tarih). */
  meta?: React.ReactNode
}) {
  return (
    <header
      id={id}
      className="scroll-mt-12 border-b border-bureau-rule px-5 pb-3 pt-6 md:px-9 md:pb-4 md:pt-8"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="flex items-baseline gap-3 md:gap-4">
          <span aria-hidden="true" className="font-mono text-[13px] tabular-nums text-bureau-amber md:text-[15px]">
            §{number}
          </span>
          <h2 className="text-[24px] font-semibold leading-none tracking-[-0.02em] text-bureau-black md:text-[30px]">
            {title}
          </h2>
        </div>
        {meta && <div className="font-mono text-[11px] tabular-nums text-bureau-muted">{meta}</div>}
      </div>
      {lede && (
        <p className="mt-2 max-w-[70ch] text-[13px] leading-relaxed text-bureau-muted md:ml-[calc(15px+1rem+0.6rem)] md:text-[14px]">
          {lede}
        </p>
      )}
    </header>
  )
}
