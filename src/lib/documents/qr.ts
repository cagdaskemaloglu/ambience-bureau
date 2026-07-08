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
