/**
 * Anasayfa bölüm başlığı — resmi belgedeki madde numarası (§1, §2...) +
 * başlık + kısa açıklama. Bkz. claude/DESIGN.md → "Yerleşim".
 *
 * Masaüstünde (lg+) tek satır: §N Başlık | açıklama | sağda belge verisi —
 * böylece ilk ekranda ürünlere daha çok yer kalır. Dar ekranda açıklama
 * başlığın altına iner.
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
      className="scroll-mt-2 border-b border-bureau-rule px-5 pb-2.5 pt-4 md:px-9 md:pt-4"
    >
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 lg:flex-nowrap">
        <div className="flex shrink-0 items-baseline gap-3 md:gap-4">
          <span aria-hidden="true" className="font-mono text-[13px] tabular-nums text-bureau-amber md:text-[15px]">
            §{number}
          </span>
          <h2 className="whitespace-nowrap text-[24px] font-semibold leading-none tracking-[-0.02em] text-bureau-black md:text-[30px]">
            {title}
          </h2>
        </div>
        {lede && (
          <p className="order-last w-full text-[13px] leading-relaxed text-bureau-muted lg:order-none lg:w-auto lg:min-w-0 lg:flex-1 lg:border-l lg:border-bureau-rule lg:pl-6 lg:text-[13.5px]">
            {lede}
          </p>
        )}
        {meta && (
          <div className="ml-auto shrink-0 whitespace-nowrap font-mono text-[11px] tabular-nums text-bureau-muted">{meta}</div>
        )}
      </div>
    </header>
  )
}
