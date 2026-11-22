import { create } from 'zustand'
import type { SlotType, LampPart, CollectionLayoutMode, LampModelDef } from '@/types'

/** Koleksiyonun 3D yerleşim ayarları (Sanity collection.layoutMode / hangFromCeiling). */
export interface CollectionLayout {
  mode?: CollectionLayoutMode | null
  hangFromCeiling?: boolean | null
  /** Sadece 'model' yerleşiminde: koleksiyonun Montajlı Modelleri. */
  models?: LampModelDef[] | null
}

function resolveLayoutMode(layout?: CollectionLayout): CollectionLayoutMode {
  return layout?.mode === 'assembled' || layout?.mode === 'model' ? layout.mode : 'stack'
}

/**
 * Montajlı model parçalarını store'un mevcut akışına uydurur: renk seçilen
 * her parça bir "body" seçimi gibi davranır (fiyat, özet, sepet, sipariş
 * ve ürün preset'i partId/slotType üzerinden AYNEN çalışır); sıra =
 * modeldeki parça sırası. Sabit parçalar fixedParts'a gider.
 */
function normalizeModels(models: LampModelDef[] | null | undefined): LampModelDef[] {
  return (models ?? [])
    .map((m) => ({
      ...m,
      parts: (m.parts ?? [])
        .filter((p): p is LampPart => !!p && !!p.partId && !!p.modelUrl)
        .map((p) => ({ ...p, slotType: 'body' as const, materials: p.materials ?? [] })),
    }))
    .filter((m) => m.parts.length > 0)
}

function modelSelectableParts(models: LampModelDef[]): LampPart[] {
  const seen = new Set<string>()
  const out: LampPart[] = []
  for (const m of models) {
    for (const p of m.parts) {
      if (p.isFixed || seen.has(p.partId)) continue
      seen.add(p.partId)
      out.push(p)
    }
  }
  return out
}

/** Bir modeli seçince: sabit parçalar + her renkli parça için varsayılan malzemeli seçim. */
function modelSelection(
  model: LampModelDef,
  materialFor?: (partId: string) => string | null | undefined
) {
  const selectable = model.parts.filter((p) => !p.isFixed)
  return {
    modelId: model.modelId,
    fixedParts: model.parts.filter((p) => p.isFixed),
    body: selectable.map((p) => {
      const wanted = materialFor?.(p.partId)
      const materialId =
        wanted && p.materials.some((m) => m.materialId === wanted) ? wanted : (p.materials[0]?.materialId ?? null)
      return { partId: p.partId, materialId }
    }),
    bodyLimits: { min: selectable.length, max: selectable.length },
  }
}

/**
 * Sabit parçaları (ör. sarkıt kablosu) seçilebilir parçalardan ayırır.
 * Seçim listeleri, kombinasyon sayısı vb. SADECE `selectable` görür;
 * sabit parçalar 3D'de ve fiyatta otomatik yer alır.
 */
function splitParts(parts: LampPart[]): { selectable: LampPart[]; fixed: LampPart[] } {
  const selectable: LampPart[] = []
  const fixed: LampPart[] = []
  for (const p of parts) {
    if (p.isFixed) fixed.push({ ...p, materials: p.materials ?? [] })
    else selectable.push({ ...p, materials: p.materials ?? [] })
  }
  return { selectable, fixed }
}

interface BodyLimits {
  min: number
  max: number
}

// Sanity'de bir koleksiyonun min/max gövde alanları boşsa kullanılacak
// varsayılan (eski sabit "en fazla 5" davranışı korunur, gövde opsiyonel).
const DEFAULT_BODY_LIMITS: BodyLimits = { min: 0, max: 5 }

/** Sanity'den gelen (boş/geçersiz olabilen) değerleri güvenli bir aralığa çevirir. */
function resolveBodyLimits(raw?: { min?: number | null; max?: number | null }): BodyLimits {
  const valid = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0
  const min = valid(raw?.min) ? Math.floor(raw.min) : DEFAULT_BODY_LIMITS.min
  const max = valid(raw?.max) ? Math.floor(raw.max) : DEFAULT_BODY_LIMITS.max
  // Studio'da yanlışlıkla max < min girilirse aralık çökmesin.
  return { min, max: Math.max(min, max) }
}

interface SlotSelection {
  partId: string | null
  materialId: string | null
}

interface HardwareFees {
  baseTRY: number
  baseUSD: number
  iotTRY: number
  iotUSD: number
}

// Sanity'de bir koleksiyonun ücret alanları boşsa (henüz doldurulmadıysa)
// kullanılacak varsayılanlar.
const DEFAULT_HARDWARE_FEES: HardwareFees = {
  baseTRY: 1600,
  baseUSD: 40,
  iotTRY: 1200,
  iotUSD: 30,
}

interface ConfiguratorStore {
  // ── State ────────────────────────────────────────────────
  collectionKey: string | null
  availableParts: LampPart[] // Sanity'den çekilen, aktif koleksiyonun SEÇİLEBİLİR parçaları (sabitler hariç)
  /** Müşteriye gösterilmeyen, her tasarımda otomatik çizilen parçalar (ör. kablo). */
  fixedParts: LampPart[]
  /** 'stack' = üst üste istif, 'assembled' = Blender'daki konum (ortak orijin). */
  layoutMode: CollectionLayoutMode
  /** Sadece 'assembled': model tavandan asılı gösterilir. */
  hangFromCeiling: boolean
  hardwareFees: HardwareFees // Aktif koleksiyonun Donanım Tahsisi/IoT ücretleri (Sanity'den)
  /** Sadece 'model' yerleşiminde: koleksiyonun modelleri ve seçili model. */
  models: LampModelDef[]
  modelId: string | null
  bodyLimits: BodyLimits // Aktif koleksiyonun min/max gövde sayısı (Sanity'den)

  base: SlotSelection
  body: SlotSelection[] // sırayla istiflenir, koleksiyonun bodyLimits.max değerine kadar
  head: SlotSelection

  lightColor: string
  lightBrightness: number // 0–1
  lightEnabled: boolean
  iotEnabled: boolean

  /**
   * LampModel tarafından her gerçek geometri ölçümünde güncellenir —
   * CameraFit'in gerçek stack yüksekliğine göre doğru mesafeyi
   * hesaplayabilmesi için (50 birimlik tahminî yükseklik yerine).
   */
  stackTotalHeight: number
  stackPartCount: number
  stackWidth: number
  stackDepth: number
  setStackMetrics: (totalHeight: number, partCount: number, width: number, depth: number) => void

  /**
   * 3D viewer'daki ölçü etiketlerinde (DimensionAnnotations) GÖSTERİLEN
   * en/boy/derinlik — SADECE bunlar Sanity Studio'daki "Dimensions (mm)"
   * bilgi amaçlı alanından (parça başına elle girilen değer) gelir; bir
   * parçada bu alan boşsa o parça için geometriden ölçülen değere düşer.
   * İstifleme (yukarıdaki stackTotalHeight/stackWidth/stackDepth) ve kamera
   * hizalaması BUNU kullanmaz, her zaman gerçek 3D geometriden hesaplanır.
   */
  displayWidth: number
  displayHeight: number
  displayDepth: number
  setDisplayMetrics: (width: number, height: number, depth: number) => void

  /** "Kamerayı Sığdır" butonuna her basıldığında artar — CameraFit bunu izler. */
  cameraFitRequestId: number
  requestCameraFit: () => void

  // ── Actions ──────────────────────────────────────────────
  setCollection: (
    key: string,
    parts: LampPart[],
    hardwareFees?: Partial<HardwareFees>,
    bodyLimits?: { min?: number | null; max?: number | null },
    layout?: CollectionLayout
  ) => void
  clearCollection: () => void

  /**
   * Bir ürünün "Customize" butonundan gelen tam parça/malzeme kombinasyonunu
   * yükler. Mevcut yarım kalmış tasarımın üzerine SORMADAN direkt yazılır
   * (setCollection ile aynı davranış). Body katmanları preset dizisindeki
   * sırayla istiflenir.
   */
  loadPreset: (
    key: string,
    parts: LampPart[],
    hardwareFees: Partial<HardwareFees> | undefined,
    preset: Array<{ slotType: SlotType; partId: string; materialId: string }>,
    bodyLimits?: { min?: number | null; max?: number | null },
    layout?: CollectionLayout
  ) => void

  /** 'model' yerleşiminde bir model seçer (renkler varsayılana döner). */
  selectModel: (modelId: string) => void

  /** Base/Head için: aynı parçaya tekrar tıklanırsa seçim kalkar (toggle). */
  toggleSinglePart: (slot: 'base' | 'head', partId: string) => void

  /** Body için: her tıklama YENİ bir katman ekler (koleksiyonun max değerine kadar). */
  addBodyPart: (partId: string) => void

  /** Bir body katmanını tamamen kaldırır. */
  removeBodyLayer: (index: number) => void

  /**
   * Bir body katmanını bir üst/alt komşusuyla yer değiştirir (dizideki
   * sıra = 3D viewer'daki dikey istifleme sırası, bkz. LampModel.tsx).
   * Uçlarda (ilk katman için 'up', son katman için 'down') sessizce
   * hiçbir şey yapmaz.
   */
  moveBodyLayer: (index: number, direction: 'up' | 'down') => void

  selectMaterial: (slot: SlotType, materialId: string, bodyIndex?: number) => void

  setLightColor: (color: string) => void
  setLightBrightness: (value: number) => void
  toggleLight: () => void
  toggleIot: () => void

  reset: () => void

  // ── Derived (selector'lar) ────────────────────────────────
  getTotalPrice: (locale: 'tr' | 'en') => number
  getSelectedPart: (slot: SlotType, bodyIndex?: number) => LampPart | undefined
  getSelectedMaterial: (slot: SlotType, bodyIndex?: number) => LampPart['materials'][number] | undefined
  getBodyPartCount: (partId: string) => number // aynı parça kaç katmanda kullanılıyor
  isComplete: () => boolean // gerekli slotlar (koleksiyonda parçası olan taban/başlık) + min–max gövde aralığı
  /** Bu koleksiyonda müşterinin seçebileceği bir taban/başlık parçası var mı? (yoksa slot gizlenir ve zorunlu değildir) */
  hasSlot: (slot: 'base' | 'head') => boolean
}

const initialSlotState: SlotSelection = { partId: null, materialId: null }

export const useConfiguratorStore = create<ConfiguratorStore>()((set, get) => ({
  collectionKey: null,
  availableParts: [],
  fixedParts: [],
  layoutMode: 'stack',
  hangFromCeiling: false,
  hardwareFees: DEFAULT_HARDWARE_FEES,
  bodyLimits: DEFAULT_BODY_LIMITS,
  models: [],
  modelId: null,

  base: { ...initialSlotState },
  body: [], // boş başlar — kullanıcı tıkladıkça katman eklenir
  head: { ...initialSlotState },

  lightColor: '#F5D78E', // varsayılan sıcak beyaz ton
  lightBrightness: 0.7,
  lightEnabled: true,
  iotEnabled: true,

  stackTotalHeight: 0,
  stackPartCount: 0,
  stackWidth: 0,
  stackDepth: 0,
  setStackMetrics: (totalHeight, partCount, width, depth) =>
    set((state) => {
      if (
        state.stackTotalHeight === totalHeight &&
        state.stackPartCount === partCount &&
        state.stackWidth === width &&
        state.stackDepth === depth
      ) {
        return state
      }
      return { stackTotalHeight: totalHeight, stackPartCount: partCount, stackWidth: width, stackDepth: depth }
    }),

  displayWidth: 0,
  displayHeight: 0,
  displayDepth: 0,
  setDisplayMetrics: (width, height, depth) =>
    set((state) => {
      if (state.displayWidth === width && state.displayHeight === height && state.displayDepth === depth) {
        return state
      }
      return { displayWidth: width, displayHeight: height, displayDepth: depth }
    }),

  cameraFitRequestId: 0,
  requestCameraFit: () => set((state) => ({ cameraFitRequestId: state.cameraFitRequestId + 1 })),

  setCollection: (key, parts, hardwareFees, bodyLimits, layout) => {
    const mode = resolveLayoutMode(layout)
    const models = mode === 'model' ? normalizeModels(layout?.models) : []
    const { selectable, fixed } = mode === 'model' ? { selectable: modelSelectableParts(models), fixed: [] as LampPart[] } : splitParts(parts)
    // Tek model varsa doğrudan seçili gelir (model seçim adımı atlanır).
    const auto = models.length === 1 ? modelSelection(models[0]) : null
    // Object.assign yerine tek tek kontrol: Sanity'den bir alan boş/undefined
    // gelirse (henüz doldurulmadıysa) varsayılanın üzerine yazılmasın.
    const merged: HardwareFees = { ...DEFAULT_HARDWARE_FEES }
    if (hardwareFees) {
      for (const k of Object.keys(merged) as Array<keyof HardwareFees>) {
        if (typeof hardwareFees[k] === 'number') merged[k] = hardwareFees[k] as number
      }
    }
    set({
      collectionKey: key,
      availableParts: selectable,
      fixedParts: auto?.fixedParts ?? fixed,
      layoutMode: mode,
      hangFromCeiling: mode !== 'stack' && !!layout?.hangFromCeiling,
      hardwareFees: merged,
      bodyLimits: auto?.bodyLimits ?? (mode === 'model' ? { min: 0, max: 0 } : resolveBodyLimits(bodyLimits)),
      models,
      modelId: auto?.modelId ?? null,
      // Koleksiyon değişince seçimleri sıfırla
      base: { ...initialSlotState },
      body: auto?.body ?? [],
      head: { ...initialSlotState },
      stackTotalHeight: 0,
      stackPartCount: 0,
      stackWidth: 0,
      stackDepth: 0,
      displayWidth: 0,
      displayHeight: 0,
      displayDepth: 0,
    })
  },

  clearCollection: () =>
    set({
      collectionKey: null,
      availableParts: [],
      fixedParts: [],
      layoutMode: 'stack',
      hangFromCeiling: false,
      hardwareFees: DEFAULT_HARDWARE_FEES,
      bodyLimits: DEFAULT_BODY_LIMITS,
      models: [],
      modelId: null,
      base: { ...initialSlotState },
      body: [],
      head: { ...initialSlotState },
      stackTotalHeight: 0,
      stackPartCount: 0,
      stackWidth: 0,
      stackDepth: 0,
      displayWidth: 0,
      displayHeight: 0,
      displayDepth: 0,
    }),

  loadPreset: (key, parts, hardwareFees, preset, bodyLimits, layout) => {
    const mode = resolveLayoutMode(layout)
    if (mode === 'model') {
      // Preset'teki parça kimliklerini en çok kapsayan modeli bul; renkleri
      // preset'ten al (bulunamazsa parçanın ilk malzemesi).
      get().setCollection(key, parts, hardwareFees, bodyLimits, layout)
      const models = get().models
      const ids = new Set(preset.map((p) => p.partId))
      const score = (m: LampModelDef) => m.parts.filter((p) => ids.has(p.partId)).length
      const best = [...models].sort((a, b) => score(b) - score(a))[0]
      if (best && score(best) > 0) {
        set(modelSelection(best, (partId) => preset.find((p) => p.partId === partId)?.materialId))
      }
      return
    }
    const { selectable, fixed } = splitParts(parts)
    const merged: HardwareFees = { ...DEFAULT_HARDWARE_FEES }
    if (hardwareFees) {
      for (const k of Object.keys(merged) as Array<keyof HardwareFees>) {
        if (typeof hardwareFees[k] === 'number') merged[k] = hardwareFees[k] as number
      }
    }

    const baseEntry = preset.find((p) => p.slotType === 'base')
    const headEntry = preset.find((p) => p.slotType === 'head')
    const limits = resolveBodyLimits(bodyLimits)
    const bodyEntries = preset.filter((p) => p.slotType === 'body').slice(0, limits.max)

    set({
      collectionKey: key,
      availableParts: selectable,
      fixedParts: fixed,
      layoutMode: mode,
      hangFromCeiling: mode === 'assembled' && !!layout?.hangFromCeiling,
      hardwareFees: merged,
      bodyLimits: limits,
      models: [],
      modelId: null,
      base: baseEntry ? { partId: baseEntry.partId, materialId: baseEntry.materialId } : { ...initialSlotState },
      body: bodyEntries.map((b) => ({ partId: b.partId, materialId: b.materialId })),
      head: headEntry ? { partId: headEntry.partId, materialId: headEntry.materialId } : { ...initialSlotState },
      stackTotalHeight: 0,
      stackPartCount: 0,
      stackWidth: 0,
      stackDepth: 0,
      displayWidth: 0,
      displayHeight: 0,
      displayDepth: 0,
    })
  },

  selectModel: (modelId) => {
    const model = get().models.find((m) => m.modelId === modelId)
    if (!model) return
    set({
      ...modelSelection(model),
      stackTotalHeight: 0,
      stackPartCount: 0,
      stackWidth: 0,
      stackDepth: 0,
      displayWidth: 0,
      displayHeight: 0,
      displayDepth: 0,
    })
  },

  toggleSinglePart: (slot, partId) => {
    const part = get().availableParts.find((p) => p.partId === partId)
    const defaultMaterialId = part?.materials[0]?.materialId ?? null

    set((state) => {
      const current = slot === 'base' ? state.base : state.head
      // Aynı parçaya tekrar tıklandıysa seçimi kaldır
      const isSameSelected = current.partId === partId
      const next: SlotSelection = isSameSelected
        ? { ...initialSlotState }
        : { partId, materialId: defaultMaterialId }

      return slot === 'base' ? { base: next } : { head: next }
    })
  },

  addBodyPart: (partId) => {
    const part = get().availableParts.find((p) => p.partId === partId)
    const defaultMaterialId = part?.materials[0]?.materialId ?? null

    set((state) => {
      if (state.body.length >= state.bodyLimits.max) return state
      return {
        body: [...state.body, { partId, materialId: defaultMaterialId }],
      }
    })
  },

  removeBodyLayer: (index) =>
    set((state) => ({
      body: state.body.filter((_, i) => i !== index),
    })),

  moveBodyLayer: (index, direction) =>
    set((state) => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= state.body.length) return state
      const newBody = [...state.body]
      ;[newBody[index], newBody[targetIndex]] = [newBody[targetIndex], newBody[index]]
      return { body: newBody }
    }),

  selectMaterial: (slot, materialId, bodyIndex) =>
    set((state) => {
      if (slot === 'body' && bodyIndex !== undefined) {
        const newBody = [...state.body]
        newBody[bodyIndex] = { ...newBody[bodyIndex], materialId }
        return { body: newBody }
      }
      if (slot === 'base') {
        return { base: { ...state.base, materialId } }
      }
      if (slot === 'head') {
        return { head: { ...state.head, materialId } }
      }
      return {}
    }),

  setLightColor: (color) => set({ lightColor: color }),
  setLightBrightness: (value) => set({ lightBrightness: Math.max(0, Math.min(1, value)) }),
  toggleLight: () => set((state) => ({ lightEnabled: !state.lightEnabled })),
  toggleIot: () => set((state) => ({ iotEnabled: !state.iotEnabled })),

  reset: () =>
    set((state) => {
      const model = state.layoutMode === 'model' ? state.models.find((m) => m.modelId === state.modelId) : undefined
      return {
      ...(model ? modelSelection(model) : {}),
      base: { ...initialSlotState },
      body: model ? modelSelection(model).body : [],
      head: { ...initialSlotState },
      lightColor: '#F5D78E',
      lightBrightness: 0.7,
      lightEnabled: true,
      iotEnabled: true,
      }
    }),

  getTotalPrice: (locale) => {
    const state = get()
    let total = 0

    const addSlotPrice = (selection: SlotSelection) => {
      if (!selection.partId) return
      const part = state.availableParts.find((p) => p.partId === selection.partId)
      if (!part) return
      total += locale === 'tr' ? part.basePriceTRY : part.basePriceUSD
      const material = part.materials.find((m) => m.materialId === selection.materialId)
      if (material) {
        total += locale === 'tr' ? material.priceModifierTRY : material.priceModifierUSD
      }
    }

    addSlotPrice(state.base)
    state.body.forEach(addSlotPrice)
    addSlotPrice(state.head)

    // Sabit parçalar (ör. kablo) her tasarımda var — fiyatları girildiyse eklenir.
    for (const part of state.fixedParts) {
      total += (locale === 'tr' ? part.basePriceTRY : part.basePriceUSD) ?? 0
    }

    // Donanım Tahsisi (Hardware Allocation) — taban ücret her zaman eklenir;
    // IoT açıksa bunun ÜZERİNE ek IoT ücreti de eklenir. Tutarlar koleksiyona
    // göre Sanity'den gelir (state.hardwareFees) — kod değişikliği gerekmez.
    total += locale === 'tr' ? state.hardwareFees.baseTRY : state.hardwareFees.baseUSD
    if (state.iotEnabled) {
      total += locale === 'tr' ? state.hardwareFees.iotTRY : state.hardwareFees.iotUSD
    }

    return total
  },

  getSelectedPart: (slot, bodyIndex) => {
    const state = get()
    const selection =
      slot === 'body' && bodyIndex !== undefined
        ? state.body[bodyIndex]
        : slot === 'base'
          ? state.base
          : state.head

    if (!selection?.partId) return undefined
    return state.availableParts.find((p) => p.partId === selection.partId)
  },

  getSelectedMaterial: (slot, bodyIndex) => {
    const state = get()
    const part = state.getSelectedPart(slot, bodyIndex)
    if (!part) return undefined

    const selection =
      slot === 'body' && bodyIndex !== undefined
        ? state.body[bodyIndex]
        : slot === 'base'
          ? state.base
          : state.head

    return part.materials.find((m) => m.materialId === selection?.materialId)
  },

  getBodyPartCount: (partId) => {
    return get().body.filter((b) => b.partId === partId).length
  },

  hasSlot: (slot) => get().layoutMode !== 'model' && get().availableParts.some((p) => p.slotType === slot),

  isComplete: () => {
    const state = get()
    if (state.layoutMode === 'model') {
      // Model seçili ve her renkli parçanın rengi seçili olmalı.
      return !!state.modelId && state.body.length > 0 && state.body.every((b) => !!b.partId && !!b.materialId)
    }
    // Koleksiyonda seçilebilir taban/başlık parçası YOKSA o slot zorunlu değildir
    // (ör. sarkıt: sadece başlık + sabit kablo; masa lambası: taban + başlık).
    const hasBase = !state.hasSlot('base') || (!!state.base.partId && !!state.base.materialId)
    const hasHead = !state.hasSlot('head') || (!!state.head.partId && !!state.head.materialId)
    const hasAllBody = state.body.every((b) => !!b.partId && !!b.materialId)
    // Gövde sayısı koleksiyonun Sanity'deki min–max aralığında olmalı
    // (min 0 ise gövde opsiyoneldir). Taban ve başlık her zaman zorunlu.
    const bodyCountOk =
      state.body.length >= state.bodyLimits.min && state.body.length <= state.bodyLimits.max
    return hasBase && hasHead && hasAllBody && bodyCountOk
  },
}))

export { DEFAULT_BODY_LIMITS }