import { create } from 'zustand'
import type { SlotType, LampPart } from '@/types'

const MAX_BODY_LAYERS = 5

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
  availableParts: LampPart[] // Sanity'den çekilen, aktif koleksiyonun tüm parçaları
  hardwareFees: HardwareFees // Aktif koleksiyonun Donanım Tahsisi/IoT ücretleri (Sanity'den)

  base: SlotSelection
  body: SlotSelection[] // sırayla istiflenir, en fazla MAX_BODY_LAYERS adet
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

  /** "Kamerayı Sığdır" butonuna her basıldığında artar — CameraFit bunu izler. */
  cameraFitRequestId: number
  requestCameraFit: () => void

  // ── Actions ──────────────────────────────────────────────
  setCollection: (key: string, parts: LampPart[], hardwareFees?: Partial<HardwareFees>) => void
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
    preset: Array<{ slotType: SlotType; partId: string; materialId: string }>
  ) => void

  /** Base/Head için: aynı parçaya tekrar tıklanırsa seçim kalkar (toggle). */
  toggleSinglePart: (slot: 'base' | 'head', partId: string) => void

  /** Body için: her tıklama YENİ bir katman ekler (üst sınıra kadar). */
  addBodyPart: (partId: string) => void

  /** Bir body katmanını tamamen kaldırır. */
  removeBodyLayer: (index: number) => void

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
  isComplete: () => boolean // taban + en az 1 gövde + başlık seçilmiş mi
}

const initialSlotState: SlotSelection = { partId: null, materialId: null }

export const useConfiguratorStore = create<ConfiguratorStore>()((set, get) => ({
  collectionKey: null,
  availableParts: [],
  hardwareFees: DEFAULT_HARDWARE_FEES,

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

  cameraFitRequestId: 0,
  requestCameraFit: () => set((state) => ({ cameraFitRequestId: state.cameraFitRequestId + 1 })),

  setCollection: (key, parts, hardwareFees) => {
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
      availableParts: parts,
      hardwareFees: merged,
      // Koleksiyon değişince seçimleri sıfırla
      base: { ...initialSlotState },
      body: [],
      head: { ...initialSlotState },
      stackTotalHeight: 0,
      stackPartCount: 0,
      stackWidth: 0,
      stackDepth: 0,
    })
  },

  clearCollection: () =>
    set({
      collectionKey: null,
      availableParts: [],
      hardwareFees: DEFAULT_HARDWARE_FEES,
      base: { ...initialSlotState },
      body: [],
      head: { ...initialSlotState },
      stackTotalHeight: 0,
      stackPartCount: 0,
      stackWidth: 0,
      stackDepth: 0,
    }),

  loadPreset: (key, parts, hardwareFees, preset) => {
    const merged: HardwareFees = { ...DEFAULT_HARDWARE_FEES }
    if (hardwareFees) {
      for (const k of Object.keys(merged) as Array<keyof HardwareFees>) {
        if (typeof hardwareFees[k] === 'number') merged[k] = hardwareFees[k] as number
      }
    }

    const baseEntry = preset.find((p) => p.slotType === 'base')
    const headEntry = preset.find((p) => p.slotType === 'head')
    const bodyEntries = preset.filter((p) => p.slotType === 'body').slice(0, MAX_BODY_LAYERS)

    set({
      collectionKey: key,
      availableParts: parts,
      hardwareFees: merged,
      base: baseEntry ? { partId: baseEntry.partId, materialId: baseEntry.materialId } : { ...initialSlotState },
      body: bodyEntries.map((b) => ({ partId: b.partId, materialId: b.materialId })),
      head: headEntry ? { partId: headEntry.partId, materialId: headEntry.materialId } : { ...initialSlotState },
      stackTotalHeight: 0,
      stackPartCount: 0,
      stackWidth: 0,
      stackDepth: 0,
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
      if (state.body.length >= MAX_BODY_LAYERS) return state
      return {
        body: [...state.body, { partId, materialId: defaultMaterialId }],
      }
    })
  },

  removeBodyLayer: (index) =>
    set((state) => ({
      body: state.body.filter((_, i) => i !== index),
    })),

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
    set({
      base: { ...initialSlotState },
      body: [],
      head: { ...initialSlotState },
      lightColor: '#F5D78E',
      lightBrightness: 0.7,
      lightEnabled: true,
      iotEnabled: true,
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

  isComplete: () => {
    const state = get()
    const hasBase = !!state.base.partId && !!state.base.materialId
    const hasHead = !!state.head.partId && !!state.head.materialId
    const hasAllBody = state.body.every((b) => !!b.partId && !!b.materialId)
    // Gövde (body) opsiyoneldir — taban ve başlık zorunlu, gövde hiç seçilmeyebilir
    return hasBase && hasHead && hasAllBody
  },
}))

export { MAX_BODY_LAYERS }