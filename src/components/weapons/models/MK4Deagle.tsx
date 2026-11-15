import React, { useRef } from 'react';
import * as THREE from 'three';

interface WeaponModelProps {
  isThirdPerson?: boolean;
  reloadProgress?: number;
  recoilProgress?: number;
  muzzleRef?: React.RefObject<THREE.Group>;
  ejectionRef?: React.RefObject<THREE.Group>;
}

export const MK4Deagle: React.FC<WeaponModelProps> = ({
  isThirdPerson = false,
  reloadProgress = 0,
  recoilProgress = 0,
  muzzleRef,
  ejectionRef,
}) => {
  const rootRef = useRef<THREE.Group>(null);

  // Materials
  const brushedSilver = new THREE.MeshStandardMaterial({
    color: 0xd6dade,
    metalness: 0.95,
    roughness: 0.22,
  });

  const blackFrame = new THREE.MeshStandardMaterial({
    color: 0x181a1d,
    metalness: 0.7,
    roughness: 0.45,
  });

  const gripRubber = new THREE.MeshStandardMaterial({
    color: 0x111315,
    metalness: 0.1,
    roughness: 0.9,
  });

  const laserEmitter = new THREE.MeshBasicMaterial({
    color: 0xff0033,
  });

  const brassCartridge = new THREE.MeshStandardMaterial({
    color: 0xcca033,
    metalness: 0.95,
    roughness: 0.2,
  });

  // Slide recoil kickback
  const slideZ = recoilProgress * 0.05;

  // Magazine reload animation
  let magYOffset = 0;
  if (reloadProgress > 0.15 && reloadProgress < 0.85) {
    if (reloadProgress < 0.4) {
      const t = (reloadProgress - 0.15) / 0.25;
      magYOffset = -t * 0.25;
    } else if (reloadProgress < 0.6) {
      magYOffset = -0.25;
    } else {
      const t = 1 - (reloadProgress - 0.6) / 0.25;
      magYOffset = -t * 0.25;
    }
  }

  return (
    <group ref={rootRef} scale={isThirdPerson ? [0.85, 0.85, 0.85] : [1, 1, 1]}>
      {/* --- LOWER FRAME --- */}
      <mesh position={[0, -0.015, -0.04]} material={blackFrame} castShadow>
        <boxGeometry args={[0.038, 0.045, 0.22]} />
      </mesh>

      {/* Tactical Under-Barrel Picatinny Rail */}
      <mesh position={[0, -0.04, -0.1]} material={blackFrame}>
        <boxGeometry args={[0.026, 0.008, 0.1]} />
      </mesh>

      {/* Laser Module */}
      <group position={[0, -0.052, -0.1]}>
        <mesh material={blackFrame} castShadow>
          <boxGeometry args={[0.024, 0.016, 0.075]} />
        </mesh>
        {/* Laser Glass Aperture */}
        <mesh position={[0, 0, -0.038]} material={laserEmitter}>
          <circleGeometry args={[0.003, 12]} />
        </mesh>
      </group>

      {/* --- TWO-TONE BRUSHED SILVER SLIDE (Animates backward during recoil) --- */}
      <group position={[0, 0.028, -0.03 + slideZ]}>
        {/* Main Chunky Slide Body */}
        <mesh material={brushedSilver} castShadow>
          <boxGeometry args={[0.04, 0.048, 0.24]} />
        </mesh>

        {/* Top Sight Blade (Front & Rear) */}
        <mesh position={[0, 0.028, 0.08]} material={blackFrame}>
          <boxGeometry args={[0.02, 0.01, 0.01]} />
        </mesh>
        <mesh position={[0, 0.028, -0.11]} material={blackFrame}>
          <boxGeometry args={[0.006, 0.01, 0.01]} />
        </mesh>

        {/* Cocking Serrations (Rear) */}
        {[-0.01, 0.02, 0.05].map((z, idx) => (
          <mesh key={idx} position={[0.021, 0, z]} material={blackFrame}>
            <boxGeometry args={[0.002, 0.035, 0.006]} />
          </mesh>
        ))}
        {[-0.01, 0.02, 0.05].map((z, idx) => (
          <mesh key={`l-${idx}`} position={[-0.021, 0, z]} material={blackFrame}>
            <boxGeometry args={[0.002, 0.035, 0.006]} />
          </mesh>
        ))}

        {/* Ejection Cutout */}
        <mesh position={[0.014, 0.01, -0.02]} material={blackFrame}>
          <boxGeometry args={[0.016, 0.025, 0.06]} />
        </mesh>
        {/* Visible Chambered Brass Round inside */}
        <mesh position={[0.01, 0.008, -0.02]} rotation={[Math.PI / 2, 0, 0]} material={brassCartridge}>
          <cylinderGeometry args={[0.006, 0.006, 0.03, 12]} />
        </mesh>
      </group>

      {/* Ejection Ref Node for Shell Casings */}
      <group ref={ejectionRef} position={[0.025, 0.035, -0.04]} rotation={[0, 0.4, 0]} />

      {/* Fixed Barrel Core */}
      <mesh position={[0, 0.028, -0.16]} rotation={[Math.PI / 2, 0, 0]} material={blackFrame} castShadow>
        <cylinderGeometry args={[0.013, 0.013, 0.05, 16]} />
      </mesh>

      {/* Muzzle Ref Anchor */}
      <group ref={muzzleRef} position={[0, 0.028, -0.19]} />

      {/* --- HAMMER & BEAVERTAIL --- */}
      <group position={[0, 0.035, 0.09]}>
        <mesh rotation={[recoilProgress > 0.1 ? 0.4 : 0, 0, 0]} material={brushedSilver}>
          <boxGeometry args={[0.014, 0.025, 0.018]} />
        </mesh>
      </group>
      {/* Beavertail Grip Safety */}
      <mesh position={[0, 0.01, 0.09]} rotation={[-0.4, 0, 0]} material={blackFrame}>
        <boxGeometry args={[0.032, 0.015, 0.04]} />
      </mesh>

      {/* --- ERGONOMIC TEXTURED GRIP --- */}
      <group position={[0, -0.09, 0.02]} rotation={[-0.26, 0, 0]}>
        {/* Main Grip Handle */}
        <mesh material={gripRubber} castShadow>
          <boxGeometry args={[0.036, 0.14, 0.065]} />
        </mesh>
        {/* Grip Side Panels */}
        <mesh position={[0.019, 0, 0]} material={blackFrame}>
          <boxGeometry args={[0.002, 0.1, 0.045]} />
        </mesh>
        <mesh position={[-0.019, 0, 0]} material={blackFrame}>
          <boxGeometry args={[0.002, 0.1, 0.045]} />
        </mesh>
      </group>

      {/* Trigger & Guard */}
      <mesh position={[0, -0.045, -0.01]} material={blackFrame}>
        <torusGeometry args={[0.018, 0.0025, 8, 16, Math.PI]} />
      </mesh>
      <mesh position={[0, -0.035, -0.005]} rotation={[0.2, 0, 0]} material={brushedSilver}>
        <boxGeometry args={[0.004, 0.018, 0.006]} />
      </mesh>

      {/* --- 7-ROUND BOX MAGAZINE --- */}
      <group position={[0, -0.15 + magYOffset, 0.04]} rotation={[-0.26, 0, 0]}>
        <mesh material={blackFrame} castShadow>
          <boxGeometry args={[0.028, 0.08, 0.045]} />
        </mesh>
        <mesh position={[0, -0.042, 0]} material={brushedSilver}>
          <boxGeometry args={[0.032, 0.01, 0.05]} />
        </mesh>
      </group>
    </group>
  );
};
