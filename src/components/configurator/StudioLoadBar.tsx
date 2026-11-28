/**
 * Stüdyo yükleme çubuğu: 3B görüntüleyicinin üstünde, etiketiyle.
 * 'loading' → 0,25 sn'de %60; 'done' → 0,15 sn'de %100 ve söner (globals.css).
 */
export function StudioLoadBar({ stage, tr, className = '' }: { stage: 'loading' | 'done'; tr: boolean; className?: string }) {
  return (
    <div
      data-stage={stage}
      role="progressbar"
      aria-label={tr ? 'Stüdyo yükleniyor' : 'Loading studio'}
      className={`studio-loadwrap pointer-events-none ${className}`}
    >
      <div className="mb-1.5 flex items-center justify-between font-mono text-[9.5px] uppercase tracking-widest text-bureau-wire">
        <span>{stage === 'done' ? (tr ? 'Malzeme tahsis ediliyor' : 'Allocating material') : tr ? 'Tel kafes çiziliyor' : 'Drafting wireframe'}</span>
        <span className="tabular-nums">{stage === 'done' ? '100%' : '60%'}</span>
      </div>
      <div className="h-[2px] w-full bg-bureau-wire/20">
        <span data-stage={stage} className="studio-loadbar block h-full w-full bg-bureau-amber shadow-[0_0_8px_rgb(var(--bureau-amber)/0.7)]" />
      </div>
    </div>
  )
}
