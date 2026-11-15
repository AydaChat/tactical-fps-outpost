'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getHazardTexture } from './textures';
import { JumpPadConfig } from './collision';

interface JumpPadProps {
  config: JumpPadConfig;
  onLaunch?: () => void;
}

export const JumpPad: React.FC<JumpPadProps> = ({ config }) => {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef1 = useRef<THREE.Mesh>(null);
  const ringRef2 = useRef<THREE.Mesh>(null);
  const beamRef = useRef<THREE.Mesh>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);

  const hazardTexture = useMemo(() => {
    const tex = getHazardTexture().clone();
    tex.repeat.set(4, 1);
    tex.needsUpdate = true;
    return tex;
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Pulse core light intensity
    if (coreLightRef.current) {
      coreLightRef.current.intensity = 2.5 + Math.sin(time * 6) * 1.0;
    }

    // Rotate and animate floating energy rings
    if (ringRef1.current) {
      ringRef1.current.rotation.y += delta * 1.8;
      ringRef1.current.position.y = 0.25 + Math.sin(time * 3) * 0.08;
    }

    if (ringRef2.current) {
      ringRef2.current.rotation.y -= delta * 2.4;
      ringRef2.current.position.y = 0.45 + Math.cos(time * 3.5) * 0.1;
      const scale = 0.9 + Math.sin(time * 4) * 0.1;
      ringRef2.current.scale.set(scale, scale, 1);
    }

    // Energy vertical beam column oscillation
    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = 0.35 + Math.sin(time * 8) * 0.15;
      }
      beamRef.current.rotation.y += delta * 0.8;
    }
  });

  return (
    <group ref={groupRef} position={config.position}>
      {/* 1. Heavy Industrial Octagonal Base Plate */}
      <mesh position={[0, 0.04, 0]} receiveShadow>
        <cylinderGeometry args={[config.radius, config.radius * 1.08, 0.08, 8]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.8} />
      </mesh>

      {/* 2. Hazard Caution Rim Ring */}
      <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <ringGeometry args={[config.radius * 0.72, config.radius * 0.98, 32]} />
        <meshStandardMaterial
          map={hazardTexture}
          roughness={0.4}
          metalness={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 3. Outer Emissive Neon Blue Guide Ring */}
      <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[config.radius * 0.65, config.radius * 0.71, 32]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>

      {/* 4. Sunken Energy Induction Chamber */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[config.radius * 0.62, config.radius * 0.62, 0.06, 24]} />
        <meshStandardMaterial color="#050811" roughness={0.9} />
      </mesh>

      {/* 5. Center High-Output Grav-Emitter Dome */}
      <mesh position={[0, 0.09, 0]}>
        <sphereGeometry args={[config.radius * 0.28, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#0891b2"
          emissive="#06b6d4"
          emissiveIntensity={1.8}
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>

      {/* 6. Floating Holographic Energy Rings */}
      <mesh ref={ringRef1} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[config.radius * 0.45, 0.02, 12, 32]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.85} />
      </mesh>

      <mesh ref={ringRef2} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[config.radius * 0.32, 0.015, 12, 32]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.7} />
      </mesh>

      {/* 7. Vertical Grav-Lift Energy Beam Cylinder */}
      <mesh ref={beamRef} position={[0, 1.2, 0]}>
        <cylinderGeometry args={[config.radius * 0.38, config.radius * 0.48, 2.4, 16, 1, true]} />
        <meshBasicMaterial
          color="#06b6d4"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 8. Jump Pad Local Point Light */}
      <pointLight
        ref={coreLightRef}
        color="#06b6d4"
        intensity={3.0}
        distance={7}
        decay={2}
        position={[0, 0.6, 0]}
      />
    </group>
  );
};
