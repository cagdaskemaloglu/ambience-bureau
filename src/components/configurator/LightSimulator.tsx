'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useConfiguratorStore } from '@/lib/store/configurator'
import { useStackHeight } from './LampModel'

// Three.js r155+ fiziksel olarak doğru ışıklandırma kullanıyor — point/spot
// light'ların intensity'si artık candela biriminde. Scene.tsx'teki directional
// (~1.1) ve ambient (~0.55) ışıklar farklı bir ölçekte (lux'a yakın) çalışıyor.
// Eski değer (brightness*8 ≈ maks. 8 candela) bu yüzden pratikte görünmezdi —
// lambanın kendi ışığı sahnenin genel aydınlatmasında kayboluyordu. Bu değeri
// candela ölçeğine göre yeniden kalibre ettik. Başlangıç noktası olarak
// düşünün — beğenmezseniz MAX_INTENSITY'yi serbestçe artırıp azaltabilirsiniz.
const MAX_INTENSITY = 1400

// Aç/kapa ve parlaklık geçişi artık ani değil — bu, saniyedeki "yumuşaklık"
// hızını belirler (yüksek değer = daha hızlı geçiş). ~300-400ms'lik yumuşak
// bir sönümlenme/parlama için ayarlandı.
const DAMP_SPEED = 6

/**
 * Lambanın yaydığı ışığı simüle eder. Işık mekanizması lamba başlığının
 * (head) içine gömülü olduğu için BURADA görünür bir "ampul" objesi
 * (küre/sprite) RENDER EDİLMİYOR — sadece gerçek aydınlatma etkisi
 * (çevredeki yüzeyleri aydınlatma, gölge düşürme) var.
 */
export function LightSimulator() {
  const lightColor = useConfiguratorStore((s) => s.lightColor)
  const lightBrightness = useConfiguratorStore((s) => s.lightBrightness)
  const lightEnabled = useConfiguratorStore((s) => s.lightEnabled)
  const totalHeight = useStackHeight()

  const lightRef = useRef<THREE.PointLight>(null)
  const currentIntensity = useRef(0)

  const targetIntensity = lightEnabled ? lightBrightness * MAX_INTENSITY : 0
  // Işık kaynağını yığının üst kısmına, biraz aşağısına yerleştir
  // (başlık parçasının içinden ışık yayılıyormuş gibi)
  const lightY = Math.max(totalHeight * 0.75, 20)

  // Her frame'de mevcut intensity'yi hedefe doğru yumuşakça yaklaştır —
  // gerçek bir lambanın açılıp kapanması gibi ani değil, kademeli.
  useFrame((_, delta) => {
    if (!lightRef.current) return
    currentIntensity.current = THREE.MathUtils.damp(
      currentIntensity.current,
      targetIntensity,
      DAMP_SPEED,
      delta
    )
    lightRef.current.intensity = currentIntensity.current
  })

  if (totalHeight === 0) return null

  return (
    <pointLight
      ref={lightRef}
      position={[0, lightY, 0]}
      color={lightColor}
      intensity={0}
      decay={2}
      distance={0}
      castShadow
      shadow-mapSize-width={512}
      shadow-mapSize-height={512}
      shadow-camera-far={500}
      shadow-bias={-0.001}
    />
  )
}