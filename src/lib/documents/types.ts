export type DocType = 'certificate' | 'product_card_front' | 'product_card_back' | 'warranty'

// order_documents tablosundaki 'doc_type' enum'u sadece 3 değer içeriyor
// (certificate, product_card, warranty) — ürün kartının ön/arka yüzü tek bir
// PDF içinde 2 sayfa olarak birleştiriliyor, bu yüzden DB'de tek satır.
export type StoredDocType = 'certificate' | 'product_card' | 'warranty'

export interface DocumentTemplateData {
  certificateNo: string
  registryDate: string       // DD.MM.YYYY
  productName: string
  collectionSeries: string
  firmwareVersion: string
  registryNo: string         // ör. "007/050" — kırmızı el yazısı fontuyla basılacak
  classification: string
  assetSubtype: string
  netWeight: string          // ör. "4.82 KG"
  productImageBlock: string  // <img> tag'i ya da boş bırakma metni (HTML parçası)
  dossierQrImg: string       // <img> tag'i (QR kod, data URL)
}

export interface OrderDocumentRecord {
  id: string
  order_item_id: string
  doc_type: StoredDocType
  locale: 'tr' | 'en'
  pdf_url: string
  generated_at: string
}
