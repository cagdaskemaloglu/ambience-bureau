'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, GizmoHelper, GizmoViewport } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Suspense, useEffect, useMemo } from 'react'
import * as THREE from 'three'  

// Beyaz lamba parçaları artık beyaz zeminde değil, "uzay mavisi" bir
// gradient vitrin zemininde görüntüleniyor — hem kontrast/ayırt
// edilebilirlik için hem de daha "canlı" bir sunum için.
// Not: bureau-surface global bir token (24+ yerde kart/header arka planı
// olarak kullanılıyor) — o yüzden ona dokunmadık, sadece bu viewer'a özel
// yeni renkler tanımladık.
const VIEWER_BG_TOP = '#060912' // derin uzay/gece göğü
const VIEWER_BG_BOTTOM = '#1B2A4A' // ufuk çizgisi — daha canlı indigo-mavi
// Wrapper div'in ilk boyanışı (WebGL context hazır olmadan önce) için CSS
// karşılığı — flaş/beyaz an olmasın diye.
const VIEWER_BG_CSS = `linear-gradient(to bottom, ${VIEWER_BG_TOP}, ${VIEWER_BG_BOTTOM})`

/**
 * Sahne arka planını düz renk yerine dikey bir gradient olarak render eder.
 * ÖNEMLİ: Bu, gerçek WebGL canvas'ının bir parçası olarak çiziliyor (CSS
 * değil) — çünkü ürün ekran görüntüsü özelliği (useScreenshot.ts) sadece
 * canvas piksellerini yakalıyor. CSS gradient kullansaydık, ürün kartı ve
 * sepetteki görsellerde arka plan hep düz/siyah çıkardı.
 */
function GradientBackground({ top, bottom }: { top: string; bottom: string }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, top)
    gradient.addColorStop(1, bottom)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [top, bottom])

  useEffect(() => () => texture.dispose(), [texture])

  return <primitive attach="background" object={texture} />
}

function TechnicalGrid() {
  return (
    <gridHelper
      args={[600, 30, '#3a4a6e', '#1a2438']}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
    />
  )
}

function SceneLights({ highQuality = false }: { highQuality?: boolean }) {
  // Gölge haritası çözünürlüğü SADECE capture modunda (bkz. Scene() içindeki
  // isCaptureMode) artırılır — bu, product spin kareleri offline/önceden
  // üretilirken kullanılır, canlı ziyaretçinin tarayıcısını hiç etkilemez.
  // İnteraktif konfigüratörde performans aynı kalır (2048, değişmedi).
  const shadowMapSize = highQuality ? 4096 : 2048
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[120, 200, 100]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={10}
        shadow-camera-far={500}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-100, 80, -100]} intensity={0.3} />
    </>
  )
}

interface SceneProps {
  children: React.ReactNode
  cameraDistance?: number
}

export function Scene({ children, cameraDistance = 750 }: SceneProps) {
  // Capture modunda (bkz. SpinCaptureHook.tsx) GizmoHelper (yön pusulası)
  // gizlenir — bu bir HTML overlay değil, WebGL sahnesinin bir parçası,
  // yani product spin kareleri toDataURL() ile yakalanırken görünürdü.
  const isCaptureMode =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('capture') === '1'

  return (
    <div className="relative h-full w-full" style={{ background: VIEWER_BG_CSS }}>
      <Canvas
        shadows
        camera={{
          position: [cameraDistance * 0.6, cameraDistance * 0.45, cameraDistance * 0.6],
          fov: 40,
          near: 1,
          far: 3000,
        }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, preserveDrawingBuffer: true }}
        // dpr (device pixel ratio) SADECE capture modunda yükseltilir — bu,
        // sadece scripts/generate-spin-frames.ts'in headless Chrome'unda
        // etkili olur (bkz. Puppeteer'ın deviceScaleFactor:2 ayarı). Normal
        // ziyaretçiler için varsayılan [1,2] aralığı DEĞİŞMEDİ, yani canlı
        // konfigüratörün performansı aynı kalır.
        dpr={isCaptureMode ? [1, 3] : [1, 2]}
      >
        <GradientBackground top={VIEWER_BG_TOP} bottom={VIEWER_BG_BOTTOM} />

        <SceneLights highQuality={isCaptureMode} />
        <TechnicalGrid />

        <Suspense fallback={null}>
          <Environment preset="studio" environmentIntensity={0.6} resolution={isCaptureMode ? 1024 : 256} />
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.3}
            scale={400}
            blur={3}
            far={200}
            resolution={isCaptureMode ? 1024 : 512}
          />
        </Suspense>

        <Suspense fallback={null}>{children}</Suspense>

        {/*
          Bloom — lambanın kendi ışığının (LightSimulator.tsx) yakınındaki
          parlak/aşırı-pozlanmış yüzeylerin yumuşakça "taşması". Işığın
          kendisini temsil eden ayrı bir görsel obje YOK — bu efekt sadece
          zaten var olan, gerçekten parlak pikselleri büyütüyor, yani ışık
          mekanizması yine görünmez/gömülü kalıyor, sadece etkisi belirginleşiyor.
          NOT: useScreenshot.ts, bu efektin de dahil olduğu en güncel kareyi
          yakalayacak şekilde güncellendi (ayrıca bkz. o dosyadaki not).
        */}
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.25}
            luminanceSmoothing={0.9}
            intensity={1.2}
            mipmapBlur
            radius={0.6}
          />
        </EffectComposer>

        <OrbitControls
          makeDefault
          target={[0, 80, 0]}
          minDistance={150}
          maxDistance={1200}
          maxPolarAngle={Math.PI / 1.95}
          enableDamping
          dampingFactor={0.08}
        />

        {!isCaptureMode && (
          <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
            <GizmoViewport
              axisColors={['#E6792E', '#EDEDED', '#999999']}
              labelColor="white"
            />
          </GizmoHelper>
        )}
      </Canvas>
    </div>
  )
}