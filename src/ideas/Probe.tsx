import React, { useLayoutEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { GLTF } from 'three-stdlib'
import { PrimitiveProps } from '@react-three/fiber'

// Define a typed result from GLTF
type GLTFResult = GLTF & {
  nodes: Record<string, THREE.Object3D>
  materials: Record<string, THREE.Material>
}

export default function Probe(props: Omit<PrimitiveProps, 'object'>) {
  const { scene, materials } = useGLTF('/probe-transformed.glb') as GLTFResult

  useLayoutEffect(() => {
    Object.values(materials).forEach((material) => {
      // Narrow the type to materials that support roughness
      if ('roughness' in material) {
        (material as THREE.MeshStandardMaterial).roughness = 0
      }
    })

    const lightMaterial = materials.light
    if (lightMaterial && 'emissive' in lightMaterial) {
      Object.assign(lightMaterial, {
        color: new THREE.Color('#ff2060'),
        emissive: new THREE.Color(1, 0, 0),
        emissiveIntensity: 2,
        toneMapped: false,
      } as Partial<THREE.MeshStandardMaterial>)
    }
  }, [materials])

  return <primitive object={scene} {...props} />
}

// Optional: preload the model
useGLTF.preload('/probe-transformed.glb')
