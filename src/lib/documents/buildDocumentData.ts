import type { DocumentTemplateData } from './types'
import { buildDossierQrImgTag } from './qr'

const CATEGORY_LABELS: Record<string, { tr: string; en: string }> = {
  pendant: { tr: '[ASILI ÜNİTE]', en: '[PENDANT UNIT]' },
  wall: { tr: '[DUVAR ÜNİTESİ]', en: '[WALL-MOUNTED]' },
  desk: { tr: '[MASA ÜNİTESİ]', en: '[DESK UNIT]' },
  floor: { tr: '[ZEMİN SİSTEMİ]', en: '[FLOOR SYSTEM]' },
  strip: { tr: '[ŞERİT ELEMAN]', en: '[STRIP ELEMENT]' },
}

const DEFAULT_FIRMWARE = 'v1.0.26 [ESP32]'

function formatDate(dateStr: string | null | undefined, locale: 'tr' | 'en'): string {
  const d = dateStr ? new Date(dateStr) : new Date()
  return d.toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function productImagePlaceholder(locale: 'tr' | 'en'): string {
  return locale === 'tr'
    ? '&nbsp;&nbsp;&nbsp;[ 3D ÇİZİM BURAYA GELECEK ]'
    : '&nbsp;&nbsp;&nbsp;[ PLACE THE 3D DRAWING HERE ]'
}

export interface BuildDocumentDataParams {
  locale: 'tr' | 'en'
  baseUrl: string // örn. https://ambiencebureau.com
  orderItem: {
    certificate_no: string
    registry_no: string
    product_name: string
    item_type: 'product' | 'custom'
  }
  order: {
    paid_at: string | null
    created_at: string
  }
  // item_type === 'product' ise Sanity ürünü, 'custom' ise custom_designs kaydı
  product?: {
    images?: Array<{ asset: { url: string } }>
    category?: string
    assetSubtype?: string
    firmwareVersion?: string
    netWeightKg?: number
    collection?: { name?: Array<{ locale: string; value: string }> }
  } | null
  customDesign?: {
    snapshot_url?: string | null
    collection_key?: string
  } | null
}

export async function buildDocumentData(params: BuildDocumentDataParams): Promise<DocumentTemplateData> {
  const { locale, baseUrl, orderItem, order, product, customDesign } = params

  const registryDate = formatDate(order.paid_at ?? order.created_at, locale)

  let productImageBlock: string
  let netWeight: string
  let firmwareVersion: string
  let classification: string
  let assetSubtype: string
  let collectionSeries: string

  if (orderItem.item_type === 'custom') {
    const imgUrl = customDesign?.snapshot_url
    productImageBlock = imgUrl
      ? `<img src="${imgUrl}" style="width:100%;max-height:230px;object-fit:contain;" />`
      : productImagePlaceholder(locale)
    netWeight = '—'
    firmwareVersion = DEFAULT_FIRMWARE
    classification = locale === 'tr' ? 'ÖZEL SİCİL VARLIĞI' : 'CUSTOM REGISTRY ASSET'
    assetSubtype = customDesign?.collection_key ? `[${customDesign.collection_key.toUpperCase()}]` : ''
    collectionSeries = locale === 'tr' ? 'ÖZEL SİCİL // TEKİL ÜRETİM' : 'CUSTOM REGISTRY // UNIQUE PRODUCTION'
  } else {
    const imgUrl = product?.images?.[0]?.asset?.url
    productImageBlock = imgUrl
      ? `<img src="${imgUrl}" style="width:100%;max-height:230px;object-fit:contain;" />`
      : productImagePlaceholder(locale)
    netWeight = product?.netWeightKg ? `${product.netWeightKg} KG` : '—'
    firmwareVersion = product?.firmwareVersion || DEFAULT_FIRMWARE
    classification = locale === 'tr' ? 'AYDINLATMA VARLIĞI' : 'LIGHTING ASSET'
    assetSubtype =
      product?.assetSubtype ||
      (product?.category ? CATEGORY_LABELS[product.category]?.[locale] : '') ||
      ''
    const collectionName = product?.collection?.name?.find((n) => n.locale === locale)?.value
      ?? product?.collection?.name?.find((n) => n.locale === 'en')?.value
    collectionSeries = collectionName || (locale === 'tr' ? 'BÜRO KOLEKSİYONU' : 'BUREAU COLLECTION')
  }

  const dossierUrl = `${baseUrl}/${locale}/dossier/${orderItem.certificate_no}`
  const dossierQrImg = await buildDossierQrImgTag(dossierUrl)

  return {
    certificateNo: orderItem.certificate_no,
    registryDate,
    productName: orderItem.product_name,
    collectionSeries,
    firmwareVersion,
    registryNo: orderItem.registry_no,
    classification,
    assetSubtype,
    netWeight,
    productImageBlock,
    dossierQrImg,
  }
}
