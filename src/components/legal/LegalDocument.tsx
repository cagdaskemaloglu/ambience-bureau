interface LegalListItem {
  label?: string
  text: string
}

export interface LegalSection {
  heading: string
  paragraphs?: string[]
  items?: LegalListItem[]
}

export function LegalDocument({
  documentRef,
  sectionLabel,
  title,
  lastUpdated,
  intro,
  sections,
}: {
  documentRef: string
  sectionLabel: string
  title: string
  lastUpdated: string
  intro?: string
  sections: LegalSection[]
}) {
  return (
    <>
      <div className="border-b border-bureau-black px-6 py-3.5 font-mono text-[11px] text-bureau-muted sm:px-10">
        {documentRef}
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12 sm:px-10">
        <div className="label-mono mb-2">{sectionLabel}</div>
        <h1 className="mb-2 text-[30px] font-light uppercase tracking-wide">{title}</h1>
        <p className="mb-10 font-mono text-[10.5px] uppercase tracking-wide text-bureau-subtle">
          {lastUpdated}
        </p>

        {intro && (
          <p className="mb-10 border-b border-dashed border-bureau-rule pb-8 text-[14px] leading-relaxed text-bureau-ink">
            {intro}
          </p>
        )}

        <div className="space-y-9">
          {sections.map((section, i) => (
            <div key={i}>
              <h2 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-bureau-muted">
                {section.heading}
              </h2>

              {section.paragraphs?.map((p, j) => (
                <p key={j} className="mb-3 text-[14px] leading-relaxed text-bureau-ink last:mb-0">
                  {p}
                </p>
              ))}

              {section.items && (
                <ul className="space-y-2.5">
                  {section.items.map((item, j) => (
                    <li key={j} className="text-[14px] leading-relaxed text-bureau-ink">
                      <span className="mr-1.5 text-bureau-amber">—</span>
                      {item.label && <strong className="font-semibold">{item.label} </strong>}
                      {item.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
