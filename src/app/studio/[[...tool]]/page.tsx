'use client'

/**
 * Sanity Studio bu route'ta açılır.
 * next-intl proxy'si bu path'i dışarıda bırakır (proxy.ts'deki matcher'a dikkat).
 * Erişim: http://localhost:3000/studio
 */
import { NextStudio } from 'next-sanity/studio'
import config from '../../../../sanity.config'

export default function StudioPage() {
  return <NextStudio config={config} />
}
