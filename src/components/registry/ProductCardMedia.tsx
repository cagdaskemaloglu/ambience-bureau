'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { urlFor } from '@/lib/sanity'
import { SPIN_FRAME_COUNT, getSpinFrameUrl } from '@/lib/spinFrames'
import type { SanityImage } from '@/types'

// "Yavaş, sakin" bir dönüş hissi için: 24 kare × 190ms ≈ tur başına 4.6sn.
const ROTATE_INTERVAL_MS = 190
// Kart tam görünür olmadan biraz önce (kullanıcı aşağı kaydırırken) kare
// yüklemeye başlasın diye viewport'a küçük bir pay ekliyoruz.
const VIEWPORT_ROOT_MARGIN = '200px'

type FramesStatus = 'idle' | 'checking' | 'ready' | 'unavailable'
type ViewMode = 'photo' | '3d'

/**
 * Registry kartındaki ürün görseli. isConfigurable=false ise (ya da
 * `product-spins` bucket'ında bu ürün için hiç kare yoksa) tamamen eski
 * davranışla aynıdır: sadece fotoğraf, hiçbir toggle butonu yok.
 *
 * isConfigurable=true ise: kart görünüme girince önceden üretilmiş 360°
 * kare dizisi (bkz. scripts/generate-spin-frames.ts) arka planda yüklenir.
 * VARSAYILAN görünüm HER ZAMAN fotoğraftır — kareler hazır olsa bile
 * otomatik geçiş YAPILMAZ. Sol üstteki buton, ziyaretçi elle tıkladığında
 * fotoğraf ↔ 3D arasında geçiş sağlar.
 */
export function ProductCardMedia({
  slug,
  isConfigurable,
  image,
  alt,
}: {
  slug: string
  isConfigurable: boolean
  image?: SanityImage
  alt: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)
  const [framesStatus, setFramesStatus] = useState<FramesStatus>('idle')
  const [view, setView] = useState<ViewMode>('photo')
  const [frameIndex, setFrameIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Kart viewport'a girince (biraz önceden) tetikle.
  useEffect(() => {
    if (!isConfigurable) return
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin: VIEWPORT_ROOT_MARGIN }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [isConfigurable])

  // Viewport'a girince: önce ilk kareyi dene (yoksa "unavailable"), varsa
  // geri kalan tüm kareleri arka planda önceden yükle.
  //
  // ÖNEMLİ: `framesStatus` BİLEREK bağımlılık listesinde DEĞİL — bu effect
  // zaten kendisi setFramesStatus('checking') çağırıyor; framesStatus'u
  // bağımlılığa eklersek, state değişince effect kendi kendini temizleyip
  // (cancelled=true) yeniden çalışır ve 00.webp yanıtı gelene kadar geçen
  // sürede kalan 23 kare hiç istenmeden döngü iptal edilmiş olurdu.
  useEffect(() => {
    if (!isConfigurable || !isInView || framesStatus !== 'idle') return
    setFramesStatus('checking')
    let cancelled = false

    const probe = new window.Image()
    probe.onload = () => {
      if (cancelled) return
      let loadedCount = 0
      for (let i = 0; i < SPIN_FRAME_COUNT; i++) {
        const img = new window.Image()
        img.onload = img.onerror = () => {
          loadedCount += 1
          if (loadedCount === SPIN_FRAME_COUNT && !cancelled) setFramesStatus('ready')
        }
        img.src = getSpinFrameUrl(slug, i)
      }
    }
    probe.onerror = () => {
      if (!cancelled) setFramesStatus('unavailable')
    }
    probe.src = getSpinFrameUrl(slug, 0)

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- framesStatus
    // BİLERİNTİLİ olarak dışarıda bırakıldı, yukarıdaki yorumu oku.
  }, [isConfigurable, isInView, slug])

  // Kareler hazır olunca da varsayılan görünüm FOTOĞRAF olarak kalır —
  // ziyaretçi siteye girince her zaman fotoğrafı görür, 3D'ye geçmek
  // istediğinde sol üstteki butona kendisi tıklar (bkz. handleToggle).

  // 3D görünümdeyken, ekrandayken VE mouse kartın üzerinde değilken
  // yavaşça döndür — hover'da dönüş durur (kullanıcı modeli net görebilsin).
  useEffect(() => {
    if (view !== '3d' || framesStatus !== 'ready' || !isInView || isHovered) return
    const interval = setInterval(() => {
      setFrameIndex((i) => (i + 1) % SPIN_FRAME_COUNT)
    }, ROTATE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [view, framesStatus, isInView, isHovered])

  function handleToggle(e: React.MouseEvent) {
    // Kartın tamamı bir <Link> — bu butona tıklamak ürün detay sayfasına
    // yönlendirmeyi TETİKLEMEMELİ.
    e.preventDefault()
    e.stopPropagation()
    setView((v) => (v === 'photo' ? '3d' : 'photo'))
  }

  // Kareler tamamen yüklenip doğrulanmadan buton gösterilmez — "unavailable"
  // durumunda (bu üründe kare üretilmemiş) buton hiç görünmez.
  const showToggleButton = isConfigurable && framesStatus === 'ready'

  return (
    <div
      ref={containerRef}
      className="relative mb-2 aspect-[3/4] w-full"
      style={{ perspective: '1200px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {showToggleButton && (
        <button
          onClick={handleToggle}
          aria-label={view === 'photo' ? '3D' : 'Photo'}
          className="absolute left-1.5 top-1.5 z-10 flex h-6 w-6 items-center justify-center border border-bureau-black bg-white/90 text-bureau-muted backdrop-blur-sm transition-colors hover:border-bureau-amber hover:text-bureau-amber"
        >
          {view === 'photo' ? (
            // Küp/3D ikonu — tıklanınca 3D dönüşe geçer
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4a2 2 0 0 0 1-1.73Z" />
              <path d="m3.3 7 8.7 5 8.7-5" />
              <path d="M12 22V12" />
            </svg>
          ) : (
            // Fotoğraf ikonu — tıklanınca fotoğrafa döner
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          )}
        </button>
      )}

      <div
        className="relative h-full w-full transition-transform duration-500"
        style={{ transformStyle: 'preserve-3d', transform: view === '3d' ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* Ön yüz: fotoğraf */}
        <div
          className="absolute inset-0 flex items-center justify-center border border-bureau-rule bg-bureau-surface"
          style={{ backfaceVisibility: 'hidden' }}
        >
          {image ? (
            <Image
              src={urlFor(image).width(600).height(800).fit('max').url()}
              alt={alt}
              width={600}
              height={800}
              className="h-full w-full object-contain p-1.5"
            />
          ) : (
            <span className="font-mono text-[9px] uppercase text-bureau-subtle">No Image on Record</span>
          )}
        </div>

        {/* Arka yüz: önceden üretilmiş 360° dönüş kare dizisi. Kareler her
            120ms'de bir zaten önceden yüklenmiş (preload edilmiş) bir URL'e
            değiştiği için burada bilerek next/image DEĞİL, düz <img>
            kullanıyoruz — next/image her kare değişiminde optimizasyon
            isteği tetikleyip gereksiz yük bindirir. */}
        <div
          className="absolute inset-0 flex items-center justify-center border border-bureau-rule bg-bureau-surface"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          {framesStatus === 'ready' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={getSpinFrameUrl(slug, frameIndex)} alt={alt} className="h-full w-full object-contain p-1.5" />
          )}
        </div>
      </div>
    </div>
  )
}