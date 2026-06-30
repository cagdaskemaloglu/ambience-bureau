import { create } from 'zustand'
import type { SlotType, LampPart } from '@/types'

const MAX_BODY_LAYERS = 5

interface SlotSelection {
  partId: string | null
  materialId: string | null
}

interface ConfiguratorStore {
  // ── State ────────────────────────────────────────────────
  collectionKey: string | null
  availableParts: LampPart[] // Sanity'den çekilen, aktif koleksiyonun tüm parçaları

  base: SlotSelection
  body: SlotSelection[] // sırayla istiflenir, en fazla MAX_BODY_LAYERS adet
  head: SlotSelection

  lightColor: string
  lightBrightness: number // 0–1
  lightEnabled: boolean
  iotEnabled: boolean

  // ── Actions ──────────────────────────────────────────────
  setCollection: (key: string, parts: LampPart[]) => void
  clearCollection: () => void

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

  base: { ...initialSlotState },
  body: [], // boş başlar — kullanıcı tıkladıkça katman eklenir
  head: { ...initialSlotState },

  lightColor: '#F5D78E', // varsayılan sıcak beyaz ton
  lightBrightness: 0.7,
  lightEnabled: true,
  iotEnabled: true,

  setCollection: (key, parts) =>
    set({
      collectionKey: key,
      availableParts: parts,
      // Koleksiyon değişince seçimleri sıfırla
      base: { ...initialSlotState },
      body: [],
      head: { ...initialSlotState },
    }),

  clearCollection: () =>
    set({
      collectionKey: null,
      availableParts: [],
      base: { ...initialSlotState },
      body: [],
      head: { ...initialSlotState },
    }),

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

    if (state.iotEnabled) {
      total += locale === 'tr' ? 1200 : 33
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