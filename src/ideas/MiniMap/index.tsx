// MiniMapCanvas.tsx
import React from 'react'
import { Canvas } from '@react-three/fiber'
import { OrthographicCamera } from '@react-three/drei'
import Starter from '../../pages/index' // extract your scene into its own component
import SceneContent from './SceneContent'

export default function MiniMap() {
  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      width: 150,
      height: 150,
      border: '2px solid white',
      zIndex: 1000,
    }}>
      <Canvas orthographic camera={{ zoom: 50, position: [0, 20, 0], up: [0, 0, -1] }}>
        <ambientLight />
        <SceneContent />
      </Canvas>
    </div>
  )
}
