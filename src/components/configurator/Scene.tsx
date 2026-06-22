'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, GizmoHelper, GizmoViewport } from '@react-three/drei'
import { Suspense } from 'react'
import * as THREE from 'three'

/**
 * Teknik çizim hissi veren grid zemin.
 * "The Ambience Bureau" estetiğine uygun: ince, steril, fonksiyonel.
 */
function TechnicalGrid() {
  return (
    <gridHelper
      args={[600, 30, '#cccccc', '#e8e8e8']}
      position={[0, 0, 0]}
      rotation={[0, 0, 0]}
    />
  )
}

function SceneLights() {
  return (
    <>
      {/* Genel dolgu ışığı — yumuşak, gölgesiz */}
      <ambientLight intensity={0.4} />

      {/* Ana yönlü ışık — gölge üreten */}
      <directionalLight
        position={[120, 200, 100]}
        intensity={1.1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={10}
        shadow-camera-far={500}
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />

      {/* Karşı yönden yumuşak fill ışığı — tam siyah gölge olmasın */}
      <directionalLight position={[-100, 80, -100]} intensity={0.3} />
    </>
  )
}

interface SceneProps {
  children: React.ReactNode
  cameraDistance?: number
}

export function Scene({ children, cameraDistance = 500 }: SceneProps) {
  return (
    <div className="relative h-full w-full bg-bureau-surface">
      <Canvas
        shadows
        camera={{
          position: [cameraDistance * 0.6, cameraDistance * 0.45, cameraDistance * 0.6],
          fov: 40,
          near: 1,
          far: 3000,
        }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <color attach="background" args={['#FAFAFA']} />

        <SceneLights />
        <TechnicalGrid />

        {/* Environment ve ContactShadows AYRI bir Suspense'te — model
            yüklemesi (yeni parça eklenmesi) bunları yeniden mount etmesin,
            bu da kameranın/OrbitControls'un sıçramasına yol açıyordu. */}
        <Suspense fallback={null}>
          <Environment preset="studio" environmentIntensity={0.5} />
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.3}
            scale={400}
            blur={3}
            far={200}
          />
        </Suspense>

        <Suspense fallback={null}>{children}</Suspense>

        <OrbitControls
          makeDefault
          minDistance={150}
          maxDistance={1200}
          maxPolarAngle={Math.PI / 1.95} // zeminin altına geçmeyi engeller
          enableDamping
          dampingFactor={0.08}
        />

        <GizmoHelper alignment="bottom-right" margin={[60, 60]}>
          <GizmoViewport
            axisColors={['#E6792E', '#1a1a1a', '#999999']}
            labelColor="white"
          />
        </GizmoHelper>
      </Canvas>
    </div>
  )
}
