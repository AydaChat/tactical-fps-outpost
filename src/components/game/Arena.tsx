'use client';

import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  getGridTexture,
  getHazardTexture,
  getMetalPlateTexture,
  getConcreteTexture,
  getHexGridTexture,
  getDecalTexture,
} from './textures';
import { ARENA_JUMP_PADS, ARENA_RAMPS } from './collision';
import { JumpPad } from './JumpPad';

export const Arena: React.FC = () => {
  const reactorRef = useRef<THREE.Group>(null);
  const reactorLightRef = useRef<THREE.PointLight>(null);
  const beaconNorthRef = useRef<THREE.Group>(null);
  const beaconSouthRef = useRef<THREE.Group>(null);

  // Memoize textures with appropriate repeat scales
  const gridFloorTex = useMemo(() => {
    const t = getGridTexture().clone();
    t.repeat.set(20, 20);
    t.needsUpdate = true;
    return t;
  }, []);

  const wallMetalTex = useMemo(() => {
    const t = getMetalPlateTexture().clone();
    t.repeat.set(10, 3);
    t.needsUpdate = true;
    return t;
  }, []);

  const concreteTex = useMemo(() => {
    const t = getConcreteTexture().clone();
    t.repeat.set(4, 4);
    t.needsUpdate = true;
    return t;
  }, []);

  const platformGridTex = useMemo(() => {
    const t = getGridTexture().clone();
    t.repeat.set(6, 4);
    t.needsUpdate = true;
    return t;
  }, []);

  const catwalkTex = useMemo(() => {
    const t = getGridTexture().clone();
    t.repeat.set(3, 10);
    t.needsUpdate = true;
    return t;
  }, []);

  const rampTex = useMemo(() => {
    const t = getMetalPlateTexture().clone();
    t.repeat.set(2, 4);
    t.needsUpdate = true;
    return t;
  }, []);

  const hazardTex = useMemo(() => {
    const t = getHazardTexture().clone();
    t.repeat.set(8, 1);
    t.needsUpdate = true;
    return t;
  }, []);

  const hexTex = useMemo(() => {
    const t = getHexGridTexture().clone();
    t.repeat.set(3, 3);
    t.needsUpdate = true;
    return t;
  }, []);

  const decalAlpha = useMemo(() => getDecalTexture('OUTPOST-09 // SECTOR ALPHA'), []);
  const decalBravo = useMemo(() => getDecalTexture('OUTPOST-09 // SECTOR BRAVO'), []);

  // Frame animations for active arena elements (reactor, warning beacons)
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Reactor core rotation & light pulse
    if (reactorRef.current) {
      reactorRef.current.rotation.y += delta * 0.9;
    }
    if (reactorLightRef.current) {
      reactorLightRef.current.intensity = 4.0 + Math.sin(time * 5) * 1.5;
    }

    // Warning emergency beacons on sniper towers
    if (beaconNorthRef.current) {
      beaconNorthRef.current.rotation.y += delta * 3.5;
    }
    if (beaconSouthRef.current) {
      beaconSouthRef.current.rotation.y += delta * 3.5;
    }
  });

  return (
    <group name="OUTPOST_09_ARENA">
      {/* ==================================================================== */}
      {/* 1. MAIN ARENA FLOOR                                                  */}
      {/* ==================================================================== */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial
          map={gridFloorTex}
          roughness={0.7}
          metalness={0.5}
        />
      </mesh>

      {/* Ground Sub-base Depth Floor (Below Y=0) */}
      <mesh position={[0, -2, 0]}>
        <boxGeometry args={[82, 4, 82]} />
        <meshStandardMaterial color="#090d16" roughness={0.9} />
      </mesh>

      {/* ==================================================================== */}
      {/* 2. PERIMETER BRUTALIST FORTRESS WALLS (80m x 80m x 14m)              */}
      {/* ==================================================================== */}
      {/* North Wall */}
      <mesh position={[0, 7, -40]} receiveShadow>
        <boxGeometry args={[80, 14, 2]} />
        <meshStandardMaterial map={wallMetalTex} roughness={0.6} metalness={0.7} />
      </mesh>
      {/* North Wall Top Hazard Trim */}
      <mesh position={[0, 13.9, -39]}>
        <boxGeometry args={[80, 0.4, 0.6]} />
        <meshStandardMaterial map={hazardTex} />
      </mesh>

      {/* South Wall */}
      <mesh position={[0, 7, 40]} receiveShadow>
        <boxGeometry args={[80, 14, 2]} />
        <meshStandardMaterial map={wallMetalTex} roughness={0.6} metalness={0.7} />
      </mesh>
      {/* South Wall Top Hazard Trim */}
      <mesh position={[0, 13.9, 39]}>
        <boxGeometry args={[80, 0.4, 0.6]} />
        <meshStandardMaterial map={hazardTex} />
      </mesh>

      {/* West Wall */}
      <mesh position={[-40, 7, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[80, 14, 2]} />
        <meshStandardMaterial map={wallMetalTex} roughness={0.6} metalness={0.7} />
      </mesh>

      {/* East Wall */}
      <mesh position={[40, 7, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[80, 14, 2]} />
        <meshStandardMaterial map={wallMetalTex} roughness={0.6} metalness={0.7} />
      </mesh>

      {/* Perimeter Wall Buttresses / Reinforcement Columns */}
      {[-30, -20, -10, 10, 20, 30].map((xOffset) => (
        <group key={`buttress_n_${xOffset}`}>
          <mesh position={[xOffset, 7, -38.8]}>
            <boxGeometry args={[2.5, 14, 1.2]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.6} />
          </mesh>
          <mesh position={[xOffset, 7, 38.8]}>
            <boxGeometry args={[2.5, 14, 1.2]} />
            <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Wall Stencil Signs */}
      <mesh position={[0, 6, -38.9]}>
        <planeGeometry args={[14, 7]} />
        <meshBasicMaterial map={decalAlpha} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 6, 38.9]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[14, 7]} />
        <meshBasicMaterial map={decalBravo} transparent opacity={0.9} />
      </mesh>

      {/* ==================================================================== */}
      {/* 3. CENTRAL SUNKEN REACTOR CORE (0, 0, 0)                             */}
      {/* ==================================================================== */}
      {/* Reactor Base Ring */}
      <mesh position={[0, 0.6, 0]} receiveShadow>
        <cylinderGeometry args={[3.5, 3.8, 1.2, 16]} />
        <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.8} />
      </mesh>
      {/* Hazard Trim around reactor */}
      <mesh position={[0, 1.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.8, 3.5, 24]} />
        <meshStandardMaterial map={hazardTex} />
      </mesh>
      {/* Rotating Inner Core Rotor */}
      <group ref={reactorRef} position={[0, 1.6, 0]}>
        <mesh>
          <octahedronGeometry args={[1.5, 1]} />
          <meshStandardMaterial
            color="#0891b2"
            emissive="#06b6d4"
            emissiveIntensity={2.5}
            roughness={0.2}
            metalness={0.9}
            wireframe
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.9, 16, 16]} />
          <meshBasicMaterial color="#22d3ee" />
        </mesh>
      </group>
      {/* Reactor Glow Light */}
      <pointLight
        ref={reactorLightRef}
        color="#06b6d4"
        intensity={5.0}
        distance={18}
        decay={2}
        position={[0, 2.0, 0]}
      />

      {/* ==================================================================== */}
      {/* 4. SUSPENDED CENTRAL PLATFORM (Y = 4.0) & ENERGY BRIDGES             */}
      {/* ==================================================================== */}
      {/* Central Hex Platform (10m x 10m at Y=4.0) */}
      <mesh position={[0, 3.88, 0]} receiveShadow>
        <cylinderGeometry args={[5.2, 5.2, 0.25, 6]} />
        <meshStandardMaterial map={hexTex} roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Glowing Hex Trim */}
      <mesh position={[0, 4.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.8, 5.15, 6]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>

      {/* Energy Bridges (Connecting 4 platforms to Central Platform at Y=4) */}
      {/* North Bridge (z: -12 to -5) */}
      <mesh position={[0, 3.9, -8.5]}>
        <boxGeometry args={[4.8, 0.15, 7]} />
        <meshStandardMaterial
          color="#083344"
          emissive="#0891b2"
          emissiveIntensity={0.8}
          transparent
          opacity={0.85}
          roughness={0.2}
        />
      </mesh>
      {/* North Bridge Glowing Rails */}
      <mesh position={[-2.4, 4.4, -8.5]}>
        <boxGeometry args={[0.1, 0.8, 7]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>
      <mesh position={[2.4, 4.4, -8.5]}>
        <boxGeometry args={[0.1, 0.8, 7]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>

      {/* South Bridge (z: 5 to 12) */}
      <mesh position={[0, 3.9, 8.5]}>
        <boxGeometry args={[4.8, 0.15, 7]} />
        <meshStandardMaterial
          color="#083344"
          emissive="#0891b2"
          emissiveIntensity={0.8}
          transparent
          opacity={0.85}
          roughness={0.2}
        />
      </mesh>
      {/* South Bridge Glowing Rails */}
      <mesh position={[-2.4, 4.4, 8.5]}>
        <boxGeometry args={[0.1, 0.8, 7]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>
      <mesh position={[2.4, 4.4, 8.5]}>
        <boxGeometry args={[0.1, 0.8, 7]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>

      {/* West Bridge (x: -18 to -5) */}
      <mesh position={[-11.5, 3.9, 0]}>
        <boxGeometry args={[13, 0.15, 4.8]} />
        <meshStandardMaterial
          color="#083344"
          emissive="#0891b2"
          emissiveIntensity={0.8}
          transparent
          opacity={0.85}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[-11.5, 4.4, -2.4]}>
        <boxGeometry args={[13, 0.8, 0.1]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>
      <mesh position={[-11.5, 4.4, 2.4]}>
        <boxGeometry args={[13, 0.8, 0.1]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>

      {/* East Bridge (x: 5 to 18) */}
      <mesh position={[11.5, 3.9, 0]}>
        <boxGeometry args={[13, 0.15, 4.8]} />
        <meshStandardMaterial
          color="#083344"
          emissive="#0891b2"
          emissiveIntensity={0.8}
          transparent
          opacity={0.85}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[11.5, 4.4, -2.4]}>
        <boxGeometry args={[13, 0.8, 0.1]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>
      <mesh position={[11.5, 4.4, 2.4]}>
        <boxGeometry args={[13, 0.8, 0.1]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>

      {/* ==================================================================== */}
      {/* 5. MID-TIER PLATFORMS (Y = 4.0)                                      */}
      {/* ==================================================================== */}
      {/* North Mid-Tier Platform (x: [-12, 12], z: [-20, -12]) */}
      <mesh position={[0, 3.88, -16]} receiveShadow>
        <boxGeometry args={[24, 0.25, 8]} />
        <meshStandardMaterial map={platformGridTex} roughness={0.6} metalness={0.6} />
      </mesh>
      {/* North Platform Perimeter Hazard Strip */}
      <mesh position={[0, 4.01, -12.1]}>
        <boxGeometry args={[24, 0.05, 0.4]} />
        <meshStandardMaterial map={hazardTex} />
      </mesh>

      {/* South Mid-Tier Platform (x: [-12, 12], z: [12, 20]) */}
      <mesh position={[0, 3.88, 16]} receiveShadow>
        <boxGeometry args={[24, 0.25, 8]} />
        <meshStandardMaterial map={platformGridTex} roughness={0.6} metalness={0.6} />
      </mesh>
      {/* South Platform Perimeter Hazard Strip */}
      <mesh position={[0, 4.01, 12.1]}>
        <boxGeometry args={[24, 0.05, 0.4]} />
        <meshStandardMaterial map={hazardTex} />
      </mesh>

      {/* West Flank Catwalk (x: [-28, -18], z: [-16, 16]) */}
      <mesh position={[-23, 3.88, 0]} receiveShadow>
        <boxGeometry args={[10, 0.25, 32]} />
        <meshStandardMaterial map={catwalkTex} roughness={0.6} metalness={0.6} />
      </mesh>
      {/* West Catwalk Neon Edge */}
      <mesh position={[-18.1, 4.05, 0]}>
        <boxGeometry args={[0.2, 0.1, 32]} />
        <meshBasicMaterial color="#06b6d4" />
      </mesh>

      {/* East Flank Catwalk (x: [18, 28], z: [-16, 16]) */}
      <mesh position={[23, 3.88, 0]} receiveShadow>
        <boxGeometry args={[10, 0.25, 32]} />
        <meshStandardMaterial map={catwalkTex} roughness={0.6} metalness={0.6} />
      </mesh>
      {/* East Catwalk Neon Edge */}
      <mesh position={[18.1, 4.05, 0]}>
        <boxGeometry args={[0.2, 0.1, 32]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>

      {/* ==================================================================== */}
      {/* 6. SLOPED CLIMBING RAMPS (Ground Y=0 to Y=4)                         */}
      {/* ==================================================================== */}
      {/* North Ramp (z: -27 to -20, ascending toward posZ) */}
      <mesh
        position={[0, 2.0, -23.5]}
        rotation={[-Math.atan2(4, 7), 0, 0]}
        receiveShadow
      >
        <boxGeometry args={[5, 0.25, Math.hypot(7, 4)]} />
        <meshStandardMaterial map={rampTex} roughness={0.5} metalness={0.7} />
      </mesh>

      {/* South Ramp (z: 20 to 27, ascending toward negZ) */}
      <mesh
        position={[0, 2.0, 23.5]}
        rotation={[Math.atan2(4, 7), 0, 0]}
        receiveShadow
      >
        <boxGeometry args={[5, 0.25, Math.hypot(7, 4)]} />
        <meshStandardMaterial map={rampTex} roughness={0.5} metalness={0.7} />
      </mesh>

      {/* West Ramp (x: -33 to -27, ascending toward posX) */}
      <mesh
        position={[-30, 2.0, 0]}
        rotation={[0, 0, -Math.atan2(4, 6)]}
        receiveShadow
      >
        <boxGeometry args={[Math.hypot(6, 4), 0.25, 5]} />
        <meshStandardMaterial map={rampTex} roughness={0.5} metalness={0.7} />
      </mesh>

      {/* East Ramp (x: 27 to 33, ascending toward negX) */}
      <mesh
        position={[30, 2.0, 0]}
        rotation={[0, 0, Math.atan2(4, 6)]}
        receiveShadow
      >
        <boxGeometry args={[Math.hypot(6, 4), 0.25, 5]} />
        <meshStandardMaterial map={rampTex} roughness={0.5} metalness={0.7} />
      </mesh>

      {/* ==================================================================== */}
      {/* 7. HIGH SNIPER TOWERS (Y = 8.0 & 11.5)                               */}
      {/* ==================================================================== */}
      {/* --- Tower Alpha (North, z: -34) --- */}
      <group position={[0, 0, -34]}>
        {/* Tower Base Solid Block (Y: 0 to 8) */}
        <mesh position={[0, 4, 0]} receiveShadow>
          <boxGeometry args={[14, 8, 8]} />
          <meshStandardMaterial map={concreteTex} roughness={0.8} metalness={0.3} />
        </mesh>
        {/* Sniper Deck Floor (Y = 8.0) */}
        <mesh position={[0, 7.9, 0]} receiveShadow>
          <boxGeometry args={[16, 0.25, 10]} />
          <meshStandardMaterial map={wallMetalTex} roughness={0.5} metalness={0.7} />
        </mesh>
        {/* Parapets / Railings with Sniper Slits (1.1m high) */}
        <mesh position={[0, 8.55, 4.8]}>
          <boxGeometry args={[16, 1.1, 0.4]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.6} />
        </mesh>
        <mesh position={[-7.8, 8.55, 0]}>
          <boxGeometry args={[0.4, 1.1, 10]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.6} />
        </mesh>
        <mesh position={[7.8, 8.55, 0]}>
          <boxGeometry args={[0.4, 1.1, 10]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.6} />
        </mesh>
        {/* Canopy / Overhang Roof (Y = 11.5) */}
        <mesh position={[0, 11.5, 0]}>
          <boxGeometry args={[16, 0.4, 10]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>
        {/* Tower Searchlight Spotting Alpha Base */}
        <spotLight
          color="#38bdf8"
          intensity={8.0}
          distance={40}
          angle={Math.PI / 4}
          penumbra={0.4}
          position={[0, 11.2, 2]}
          target-position={[0, 0, -10]}
        />
        {/* Rotating Orange Warning Beacon */}
        <group ref={beaconNorthRef} position={[0, 11.8, 0]}>
          <mesh>
            <cylinderGeometry args={[0.3, 0.3, 0.5, 12]} />
            <meshBasicMaterial color="#f97316" />
          </mesh>
          <pointLight color="#f97316" intensity={2.0} distance={15} />
        </group>
      </group>

      {/* --- Tower Bravo (South, z: 34) --- */}
      <group position={[0, 0, 34]}>
        {/* Tower Base Solid Block (Y: 0 to 8) */}
        <mesh position={[0, 4, 0]} receiveShadow>
          <boxGeometry args={[14, 8, 8]} />
          <meshStandardMaterial map={concreteTex} roughness={0.8} metalness={0.3} />
        </mesh>
        {/* Sniper Deck Floor (Y = 8.0) */}
        <mesh position={[0, 7.9, 0]} receiveShadow>
          <boxGeometry args={[16, 0.25, 10]} />
          <meshStandardMaterial map={wallMetalTex} roughness={0.5} metalness={0.7} />
        </mesh>
        {/* Parapets / Railings with Sniper Slits (1.1m high) */}
        <mesh position={[0, 8.55, -4.8]}>
          <boxGeometry args={[16, 1.1, 0.4]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.6} />
        </mesh>
        <mesh position={[-7.8, 8.55, 0]}>
          <boxGeometry args={[0.4, 1.1, 10]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.6} />
        </mesh>
        <mesh position={[7.8, 8.55, 0]}>
          <boxGeometry args={[0.4, 1.1, 10]} />
          <meshStandardMaterial color="#1e293b" roughness={0.6} metalness={0.6} />
        </mesh>
        {/* Canopy / Overhang Roof (Y = 11.5) */}
        <mesh position={[0, 11.5, 0]}>
          <boxGeometry args={[16, 0.4, 10]} />
          <meshStandardMaterial color="#0f172a" roughness={0.7} />
        </mesh>
        {/* Tower Searchlight Spotting Bravo Base */}
        <spotLight
          color="#f43f5e"
          intensity={8.0}
          distance={40}
          angle={Math.PI / 4}
          penumbra={0.4}
          position={[0, 11.2, -2]}
          target-position={[0, 0, 10]}
        />
        {/* Rotating Red Warning Beacon */}
        <group ref={beaconSouthRef} position={[0, 11.8, 0]}>
          <mesh>
            <cylinderGeometry args={[0.3, 0.3, 0.5, 12]} />
            <meshBasicMaterial color="#ef4444" />
          </mesh>
          <pointLight color="#ef4444" intensity={2.0} distance={15} />
        </group>
      </group>

      {/* ==================================================================== */}
      {/* 8. MASSIVE STRUCTURAL SUPPORT PILLARS (3m x 3m x 12m)                */}
      {/* ==================================================================== */}
      {[
        [-16, -16],
        [16, -16],
        [-16, 16],
        [16, 16],
      ].map(([px, pz], idx) => (
        <group key={`pillar_${idx}`} position={[px, 6, pz]}>
          {/* Concrete column body */}
          <mesh receiveShadow castShadow>
            <boxGeometry args={[3, 12, 3]} />
            <meshStandardMaterial map={concreteTex} roughness={0.8} metalness={0.3} />
          </mesh>
          {/* Vertical Armor Plates with Emissive Accent */}
          <mesh position={[0, 0, 1.55]}>
            <boxGeometry args={[2.2, 10, 0.1]} />
            <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0, 1.62]}>
            <boxGeometry args={[0.1, 9, 0.05]} />
            <meshBasicMaterial color={px < 0 ? '#06b6d4' : '#f59e0b'} />
          </mesh>
        </group>
      ))}

      {/* ==================================================================== */}
      {/* 9. HEAVY INDUSTRIAL SHIPPING CONTAINERS (TACTICAL COVER)             */}
      {/* ==================================================================== */}
      {[
        { pos: [-28, 1.3, -23.5], color: '#1e3a8a', label: 'CARGO // SECTOR A' },
        { pos: [-28, 1.3, 23.5], color: '#9a3412', label: 'CARGO // SECTOR B' },
        { pos: [28, 1.3, -23.5], color: '#1e3a8a', label: 'CARGO // SECTOR A' },
        { pos: [28, 1.3, 23.5], color: '#9a3412', label: 'CARGO // SECTOR B' },
      ].map((container, idx) => (
        <group key={`container_${idx}`} position={container.pos as [number, number, number]}>
          {/* Main corrugated shipping crate */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[6, 2.6, 2.8]} />
            <meshStandardMaterial color={container.color} roughness={0.4} metalness={0.6} />
          </mesh>
          {/* Hazard Corner Decals */}
          <mesh position={[0, 0, 1.42]}>
            <boxGeometry args={[5.6, 0.3, 0.05]} />
            <meshStandardMaterial map={hazardTex} />
          </mesh>
          <mesh position={[0, 0, -1.42]}>
            <boxGeometry args={[5.6, 0.3, 0.05]} />
            <meshStandardMaterial map={hazardTex} />
          </mesh>
        </group>
      ))}

      {/* ==================================================================== */}
      {/* 10. HALF-COVER JERSEY BARRIERS & BARRICADES (HEIGHT 1.15m)            */}
      {/* ==================================================================== */}
      {/* Center Courtyard Flank Barriers */}
      <mesh position={[-8, 0.575, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 1.15, 3]} />
        <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.4} />
      </mesh>
      <mesh position={[8, 0.575, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 1.15, 3]} />
        <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.575, -8]} castShadow receiveShadow>
        <boxGeometry args={[3, 1.15, 2]} />
        <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.575, 8]} castShadow receiveShadow>
        <boxGeometry args={[3, 1.15, 2]} />
        <meshStandardMaterial color="#334155" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Alpha Frontline Covers */}
      <mesh position={[-12, 0.6, -28]} castShadow receiveShadow>
        <boxGeometry args={[4, 1.2, 2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.5} />
      </mesh>
      <mesh position={[12, 0.6, -28]} castShadow receiveShadow>
        <boxGeometry args={[4, 1.2, 2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.5} />
      </mesh>

      {/* Bravo Frontline Covers */}
      <mesh position={[-12, 0.6, 28]} castShadow receiveShadow>
        <boxGeometry args={[4, 1.2, 2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.5} />
      </mesh>
      <mesh position={[12, 0.6, 28]} castShadow receiveShadow>
        <boxGeometry args={[4, 1.2, 2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.7} metalness={0.5} />
      </mesh>

      {/* ==================================================================== */}
      {/* 11. JUMP PADS (4 High-Velocity Grav-Pads)                            */}
      {/* ==================================================================== */}
      {ARENA_JUMP_PADS.map((padConfig) => (
        <JumpPad key={padConfig.id} config={padConfig} />
      ))}
    </group>
  );
};
