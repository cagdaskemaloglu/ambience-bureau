import fs from 'fs/promises'
import path from 'path'
import type { DocumentTemplateData } from './types'

const TEMPLATES_DIR = path.join(process.cwd(), 'src/lib/documents/templates')

// Bu alanlar zaten HTML parçası (img tag vb.) olarak üretiliyor —
// bunlar escape EDİLMEZ, diğer her şey düz metin olarak escape edilir.
const RAW_HTML_KEYS: Array<keyof DocumentTemplateData> = ['productImageBlock', 'dossierQrImg']

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export type TemplateName = 'certificate' | 'product-front' | 'product-back' | 'warranty'

export async function loadTemplate(locale: 'tr' | 'en', name: TemplateName): Promise<string> {
  const filePath = path.join(TEMPLATES_DIR, locale, `${name}.html`)
  return fs.readFile(filePath, 'utf-8')
}

export function fillTemplate(templateHtml: string, data: DocumentTemplateData): string {
  let html = templateHtml
  for (const [key, value] of Object.entries(data)) {
    const token = `{{${key}}}`
    const safeValue = RAW_HTML_KEYS.includes(key as keyof DocumentTemplateData)
      ? value
      : escapeHtml(String(value ?? ''))
    html = html.split(token).join(safeValue)
  }
  return html
}
