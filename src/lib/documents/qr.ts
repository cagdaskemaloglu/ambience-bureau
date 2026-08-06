import fs from 'fs/promises'
import path from 'path'
import QRCode from 'qrcode'

// Uygulama App Store'da yayında — artık statik bir görsel beklemek yerine
// QR kodu doğrudan bu gerçek linkten üretiliyor (dossier QR'ı ile aynı
// yöntem). Google Play linki henüz yok, o yüzden Google Play QR'ı hâlâ
// public/documents/google-play-qr.png'den (varsa) okunuyor.
export const APP_STORE_URL = 'https://apps.apple.com/tr/app/ambience-bureau/id6794577754'

export async function buildDossierQrImgTag(dossierUrl: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(dossierUrl, { margin: 0, width: 164 })
    return `<img src="${dataUrl}" alt="QR" style="width:82px;height:82px;" />`
  } catch (err) {
    console.error('[documents/qr] QR üretilemedi:', err)
    return '[ QR ]'
  }
}

export async function buildAppStoreQrImgTag(): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(APP_STORE_URL, { margin: 0, width: 164 })
    return `<img src="${dataUrl}" alt="App Store QR" style="width:82px;height:82px;" />`
  } catch (err) {
    console.error('[documents/qr] App Store QR üretilemedi:', err)
    return '[ QR ]'
  }
}

// Google Play linki henüz yok — statik dosya varsa onu kullan, yoksa
// placeholder'a düş (üretimi bloklamaz).
const STATIC_ASSETS_DIR = path.join(process.cwd(), 'public', 'documents')

async function readStaticImageAsImgTag(fileName: string, alt: string): Promise<string> {
  try {
    const filePath = path.join(STATIC_ASSETS_DIR, fileName)
    const buffer = await fs.readFile(filePath)
    const ext = path.extname(fileName).slice(1) || 'png'
    const base64 = buffer.toString('base64')
    return `<img src="data:image/${ext};base64,${base64}" alt="${alt}" style="width:82px;height:82px;" />`
  } catch {
    // Görsel henüz eklenmedi — placeholder ile devam et.
    return '[ QR ]'
  }
}

export async function buildGooglePlayQrImgTag(): Promise<string> {
  return readStaticImageAsImgTag('google-play-qr.png', 'Google Play QR')
}