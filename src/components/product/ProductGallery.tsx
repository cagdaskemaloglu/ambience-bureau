'use client'

import { useState } from 'react'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import type { SanityImage } from '@/types'

export function ProductGallery({
  images,
  fallbackAlt,
}: {
  images?: SanityImage[]
  fallbackAlt: string
}) {
  const [activeIndex, setActiveIndex] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center border border-bureau-black bg-bureau-surface">
        <span className="font-mono text-[12px] uppercase tracking-wide text-bureau-subtle">
          No Image on Record
        </span>
      </div>
    )
  }

  const activeImage = images[activeIndex]

  return (
    <div>
      {/* Main image */}
      <div className="flex aspect-square items-center justify-center border border-bureau-black bg-bureau-surface">
        <Image
          src={urlFor(activeImage).width(640).height(640).fit('max').url()}
          alt={activeImage.alt ?? fallbackAlt}
          width={640}
          height={640}
          className="h-full w-full object-contain p-8"
          priority
        />
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((img, idx) => (
            <button
              key={img.asset._id}
              onClick={() => setActiveIndex(idx)}
              className={`aspect-square border bg-bureau-surface transition-colors ${
                idx === activeIndex ? 'border-bureau-amber' : 'border-bureau-rule hover:border-bureau-black'
              }`}
            >
              <Image
                src={urlFor(img).width(120).height(120).fit('max').url()}
                alt={img.alt ?? `${fallbackAlt} ${idx + 1}`}
                width={120}
                height={120}
                className="h-full w-full object-contain p-1.5"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
