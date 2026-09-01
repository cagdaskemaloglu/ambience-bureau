// "Customize edilebilir" ürünler için önceden render edilmiş 360° dönüş
// kare dizisinin (product spin) paylaşılan sabitleri.
//
// Kareler `scripts/generate-spin-frames.ts` ile üretilip Supabase
// Storage'daki `product-spins` public bucket'ına yüklenir. Hangi ürünün
// karesi var/yok diye Sanity'de AYRI bir alan YOK — frontend ilk kareyi
// (00.webp) yüklemeyi dener, 404/hata alırsa "bu üründe kare yok" kabul
// edip sessizce fotoğrafta kalır (bkz. ProductCardMedia.tsx).

export const SPIN_FRAME_COUNT = 24 // 15°'de bir kare (360° / 24)
export const SPIN_FRAME_BUCKET = 'product-spins'

// CameraFit.tsx'teki ISO_AZIMUTH_DEG ile birebir aynı olmalı — kareler bu
// açıdan başlayıp saat yönünde ilerler, böylece "3D'ye ilk geçiş" anında
// gösterilen kare (00.webp), interaktif konfigüratörün varsayılan başlangıç
// açısıyla birebir eşleşir.
export const SPIN_ISO_AZIMUTH_DEG = 45

function supabasePublicBase(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return ''
  return `${url.replace(/\/$/, '')}/storage/v1/object/public/${SPIN_FRAME_BUCKET}`
}

export function getSpinFrameUrl(slug: string, frameIndex: number): string {
  const padded = String(frameIndex).padStart(2, '0')
  return `${supabasePublicBase()}/${slug}/${padded}.webp`
}