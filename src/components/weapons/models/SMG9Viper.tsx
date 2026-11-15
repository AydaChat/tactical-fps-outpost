import React, { useRef } from 'react';
import * as THREE from 'three';

interface WeaponModelProps {
  isThirdPerson?: boolean;
  reloadProgress?: number;
  recoilProgress?: number;
  muzzleRef?: React.RefObject<THREE.Group>;
  ejectionRef?: React.RefObject<THREE.Group>;
}

export const SMG9Viper: React.FC<WeaponModelProps> = ({
  isThirdPerson = false,
  reloadProgress = 0,
  recoilProgress = 0,
  muzzleRef,
  ejectionRef,
}) => {
  const rootRef = useRef<THREE.Group>(null);

  // Materials
  const matteBlack = new THREE.MeshStandardMaterial({
    color: 0x17191d,
    metalness: 0.85,
    roughness: 0.35,
  });

  const gunmetal = new THREE.MeshStandardMaterial({
    color: 0x2c3038,
    metalness: 0.9,
    roughness: 0.28,
  });

  const cyanEmissive = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00b8c4,
    emissiveIntensity: 0.5,
    metalness: 0.2,
    roughness: 0.2,
  });

  const reflexGlass = new THREE.MeshPhysicalMaterial({
    color: 0x33eeff,
    metalness: 0.05,
    roughness: 0.05,
    transmission: 0.88,
    transparent: true,
    opacity: 0.45,
  });

  const redDot = new THREE.MeshBasicMaterial({
    color: 0xff1144,
  });

  // Reload animation for curved SMG magazine
  let magYOffset = 0;
  let magZOffset = 0;
  let magRotX = 0;
  if (reloadProgress > 0.15 && reloadProgress < 0.85) {
    if (reloadProgress < 0.4) {
      const t = (reloadProgress - 0.15) / 0.25;
      magYOffset = -t * 0.32;
      magZOffset = -t * 0.04;
      magRotX = t * 0.35;
    } else if (reloadProgress < 0.6) {
      magYOffset = -0.32;
      magZOffset = -0.04;
      magRotX = 0.35;
    } else {
      const t = 1 - (reloadProgress - 0.6) / 0.25;
      magYOffset = -t * 0.32;
      magZOffset = -t * 0.04;
      magRotX = t * 0.35;
    }
  }

  const boltZ = recoilProgress * 0.03;

  return (
    <group ref={rootRef} scale={isThirdPerson ? [0.85, 0.85, 0.85] : [1, 1, 1]}>
      {/* --- RECEIVER & CHASSIS --- */}
      <mesh position={[0, 0.015, -0.04]} material={matteBlack} castShadow>
        <boxGeometry args={[0.042, 0.065, 0.22]} />
      </mesh>

      {/* Cyberpunk Accent Trims */}
      <mesh position={[0.022, 0.02, -0.04]} material={cyanEmissive}>
        <boxGeometry args={[0.002, 0.006, 0.16]} />
      </mesh>
      <mesh position={[-0.022, 0.02, -0.04]} material={cyanEmissive}>
        <boxGeometry args={[0.002, 0.006, 0.16]} />
      </mesh>

      {/* Top Rail */}
      <mesh position={[0, 0.052, -0.04]} material={gunmetal} castShadow>
        <boxGeometry args={[0.028, 0.01, 0.24]} />
      </mesh>

      {/* Ejection Port */}
      <mesh position={[0.022, 0.025, -0.02]} material={matteBlack}>
        <boxGeometry args={[0.005, 0.022, 0.06]} />
      </mesh>
      {/* Recoiling Bolt */}
      <mesh position={[0.018, 0.025, -0.02 + boltZ]} material={gunmetal}>
        <boxGeometry args={[0.004, 0.018, 0.04]} />
      </mesh>
      <group ref={ejectionRef} position={[0.026, 0.025, -0.02]} rotation={[0, 0.4, 0]} />

      {/* --- INTEGRAL SUPPRESSOR SHROUD --- */}
      <mesh position={[0, 0.015, -0.27]} rotation={[Math.PI / 2, 0, 0]} material={gunmetal} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 0.24, 16]} />
      </mesh>
      {/* Suppressor Vents / Grooves */}
      {[-0.2, -0.25, -0.3, -0.35].map((z, idx) => (
        <mesh key={idx} position={[0, 0.015, z]} rotation={[Math.PI / 2, 0, 0]} material={matteBlack}>
          <torusGeometry args={[0.0225, 0.002, 8, 16]} />
        </mesh>
      ))}
      {/* Suppressor Muzzle Cap */}
      <mesh position={[0, 0.015, -0.39]} rotation={[Math.PI / 2, 0, 0]} material={cyanEmissive}>
        <cylinderGeometry args={[0.021, 0.021, 0.01, 16]} />
      </mesh>
      {/* Muzzle Ref Anchor */}
      <group ref={muzzleRef} position={[0, 0.015, -0.41]} />

      {/* --- TACTICAL ANGLED FOREGRIP --- */}
      <group position={[0, -0.035, -0.18]} rotation={[0.4, 0, 0]}>
        <mesh material={matteBlack} castShadow>
          <boxGeometry args={[0.028, 0.07, 0.038]} />
        </mesh>
        <mesh position={[0, 0, 0.019]} material={cyanEmissive}>
          <boxGeometry args={[0.02, 0.05, 0.003]} />
        </mesh>
      </group>

      {/* --- MINI REFLEX RED DOT SIGHT --- */}
      <group position={[0, 0.08, -0.04]}>
        {/* Mount base */}
        <mesh material={gunmetal}>
          <boxGeometry args={[0.032, 0.014, 0.06]} />
        </mesh>
        {/* Protective Arch */}
        <mesh position={[0, 0.022, 0]} material={matteBlack} castShadow>
          <boxGeometry args={[0.036, 0.034, 0.05]} />
        </mesh>
        {/* Optical Aperture Window */}
        <mesh position={[0, 0.022, 0]} material={matteBlack}>
          <boxGeometry args={[0.026, 0.024, 0.055]} />
        </mesh>
        {/* Reflex Lens */}
        <mesh position={[0, 0.022, 0.01]} material={reflexGlass}>
          <boxGeometry args={[0.025, 0.023, 0.002]} />
        </mesh>
        {/* Red Dot Reticle */}
        <mesh position={[0, 0.022, 0.009]} material={redDot}>
          <circleGeometry args={[0.002, 8]} />
        </mesh>
      </group>

      {/* --- CURVED SMG STICK MAGAZINE --- */}
      <group position={[0, -0.05 + magYOffset, -0.02 + magZOffset]} rotation={[magRotX, 0, 0]}>
        <mesh position={[0, -0.07, -0.02]} rotation={[0.2, 0, 0]} material={matteBlack} castShadow>
          <boxGeometry args={[0.028, 0.17, 0.045]} />
        </mesh>
        <mesh position={[0, -0.155, -0.003]} rotation={[0.2, 0, 0]} material={cyanEmissive}>
          <boxGeometry args={[0.03, 0.012, 0.048]} />
        </mesh>
      </group>

      {/* --- PISTOL GRIP & TRIGGER --- */}
      <group position={[0, -0.065, 0.05]} rotation={[-0.32, 0, 0]}>
        <mesh material={matteBlack} castShadow>
          <boxGeometry args={[0.032, 0.095, 0.042]} />
        </mesh>
        <mesh position={[0, -0.01, 0.022]} material={cyanEmissive}>
          <boxGeometry args={[0.015, 0.05, 0.002]} />
        </mesh>
      </group>
      <mesh position={[0, -0.045, 0.02]} material={gunmetal}>
        <torusGeometry args={[0.018, 0.0025, 8, 16, Math.PI]} />
      </mesh>

      {/* --- SKELETONIZED SLIDING STOCK --- */}
      <group position={[0, 0.02, 0.12]}>
        {/* Dual Steel Rods */}
        <mesh position={[0.018, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={gunmetal}>
          <cylinderGeometry args={[0.004, 0.004, 0.16, 8]} />
        </mesh>
        <mesh position={[-0.018, 0, 0]} rotation={[Math.PI / 2, 0, 0]} material={gunmetal}>
          <cylinderGeometry args={[0.004, 0.004, 0.16, 8]} />
        </mesh>
        {/* Buttplate */}
        <mesh position={[0, -0.01, 0.08]} material={matteBlack} castShadow>
          <boxGeometry args={[0.044, 0.09, 0.012]} />
        </mesh>
      </group>
    </group>
  );
};
