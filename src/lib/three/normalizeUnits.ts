import type * as THREE from 'three'

/**
 * Birim koruması: sitedeki tüm modeller MİLİMETRE varsayar. Blender'dan
 * metre biriminde dışa aktarılmış bir dosyada lamba ~1 birim boyunda olur ve
 * sahnede ~1 mm görünür (görünmez). En büyük boyutu 5 birimin altındaki bir
 * parça metre kabul edilip ×1000 ölçeklenir — gerçek bir lamba parçası 5 mm'den
 * küçük olmaz. Geometriyi yerinde değiştirir ve döndürür (klonlanmış olmalı).
 */
export const METRE_THRESHOLD = 5
export function normalizeUnits<T extends THREE.BufferGeometry>(geometry: T): T {
  geometry.computeBoundingBox()
  const b = geometry.boundingBox
  if (!b) return geometry
  const max = Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z)
  if (max > 0 && max < METRE_THRESHOLD) {
    geometry.scale(1000, 1000, 1000)
    geometry.computeBoundingBox()
  }
  return geometry
}
