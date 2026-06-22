'use client'

import { useConfiguratorStore } from '@/lib/store/configurator'
import { useStackHeight } from './LampModel'

/**
 * Lambanın yaydığı ışığı simüle eder.
 * Head (başlık) parçasının yaklaşık konumuna bir point light yerleştirir,
 * kullanıcının seçtiği renk/parlaklık/on-off durumuna göre günceller.
 */
export function LightSimulator() {
  const lightColor = useConfiguratorStore((s) => s.lightColor)
  const lightBrightness = useConfiguratorStore((s) => s.lightBrightness)
  const lightEnabled = useConfiguratorStore((s) => s.lightEnabled)
  const totalHeight = useStackHeight()

  if (!lightEnabled || totalHeight === 0) return null

  // Işık kaynağını yığının üst kısmına, biraz aşağısına yerleştir
  // (başlık parçasının ortasından ışık yayılıyormuş gibi)
  const lightY = Math.max(totalHeight * 0.75, 20)

  return (
    <>
      <pointLight
        position={[0, lightY, 0]}
        color={lightColor}
        intensity={lightBrightness * 8}
        distance={300}
        decay={2}
      />
      {/* Görsel "ampul" efekti — küçük parlak küre */}
      <mesh position={[0, lightY, 0]}>
        <sphereGeometry args={[8, 16, 16]} />
        <meshStandardMaterial
          color={lightColor}
          emissive={lightColor}
          emissiveIntensity={lightBrightness * 2.5}
          toneMapped={false}
        />
      </mesh>
    </>
  )
}
