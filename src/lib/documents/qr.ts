import fs from 'fs/promises'
import path from 'path'
import QRCode from 'qrcode'

export async function buildDossierQrImgTag(dossierUrl: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(dossierUrl, { margin: 0, width: 164 })
    return `<img src="${dataUrl}" alt="QR" style="width:82px;height:82px;" />`
  } catch (err) {
    console.error('[documents/qr] QR üretilemedi:', err)
    return '[ QR ]'
  }
}

// App Store / Google Play QR kodları statik — sen görselleri hazırlayınca
// public/documents/ altına koyacaksın. Dosya henüz yoksa placeholder metne
// düşer, PDF üretimini bloklamaz.
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

export async function buildAppStoreQrImgTag(): Promise<string> {
  return readStaticImageAsImgTag('app-store-qr.png', 'App Store QR')
}

export async function buildGooglePlayQrImgTag(): Promise<string> {
  return readStaticImageAsImgTag('google-play-qr.png', 'Google Play QR')
}
