import React, { useRef } from 'react';
import * as THREE from 'three';

interface WeaponModelProps {
  isThirdPerson?: boolean;
  reloadProgress?: number;
  recoilProgress?: number;
  muzzleRef?: React.RefObject<THREE.Group>;
  ejectionRef?: React.RefObject<THREE.Group>;
}

export const SR99Spectre: React.FC<WeaponModelProps> = ({
  isThirdPerson = false,
  reloadProgress = 0,
  recoilProgress = 0,
  muzzleRef,
  ejectionRef,
}) => {
  const rootRef = useRef<THREE.Group>(null);

  // Materials
  const matteCarbon = new THREE.MeshStandardMaterial({
    color: 0x181a1f,
    metalness: 0.8,
    roughness: 0.3,
  });

  const heavySteel = new THREE.MeshStandardMaterial({
    color: 0x2e333d,
    metalness: 0.95,
    roughness: 0.25,
  });

  const flutedSteel = new THREE.MeshStandardMaterial({
    color: 0x121418,
    metalness: 0.9,
    roughness: 0.35,
  });

  const scopeGlass = new THREE.MeshPhysicalMaterial({
    color: 0x00ccff,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.9,
    transparent: true,
    opacity: 0.55,
  });

  const scopeReticle = new THREE.MeshBasicMaterial({
    color: 0x00ffcc,
    transparent: true,
    opacity: 0.9,
  });

  const neonAccent = new THREE.MeshStandardMaterial({
    color: 0x00e1d9,
    emissive: 0x00a39d,
    emissiveIntensity: 0.4,
    metalness: 0.5,
    roughness: 0.3,
  });

  // Magazine animation during reload
  let magYOffset = 0;
  if (reloadProgress > 0.2 && reloadProgress < 0.8) {
    if (reloadProgress < 0.45) {
      const t = (reloadProgress - 0.2) / 0.25;
      magYOffset = -t * 0.3;
    } else if (reloadProgress < 0.55) {
      magYOffset = -0.3;
    } else {
      const t = 1 - (reloadProgress - 0.55) / 0.25;
      magYOffset = -t * 0.3;
    }
  }

  // Bolt animation during recoil / chamber cycle
  const boltZ = recoilProgress > 0.2 ? (Math.sin(recoilProgress * Math.PI) * 0.08) : 0;
  const boltRotX = recoilProgress > 0.1 ? (Math.sin(recoilProgress * Math.PI) * -0.6) : 0;

  return (
    <group ref={rootRef} scale={isThirdPerson ? [0.85, 0.85, 0.85] : [1, 1, 1]}>
      {/* --- RECEIVER --- */}
      <mesh position={[0, 0.015, -0.05]} material={heavySteel} castShadow>
        <boxGeometry args={[0.052, 0.08, 0.34]} />
      </mesh>

      {/* Top Scope Rail */}
      <mesh position={[0, 0.06, -0.05]} material={matteCarbon} castShadow>
        <boxGeometry args={[0.034, 0.012, 0.26]} />
      </mesh>

      {/* Bolt Assembly */}
      <group position={[0.026, 0.035, -0.02 + boltZ]} rotation={[boltRotX, 0, 0]}>
        <mesh position={[0.018, 0.005, 0]} rotation={[0, 0, -0.4]} material={heavySteel}>
          <cylinderGeometry args={[0.005, 0.005, 0.045, 8]} />
        </mesh>
        <mesh position={[0.035, 0.015, 0]} material={neonAccent}>
          <sphereGeometry args={[0.01, 12, 12]} />
        </mesh>
      </group>

      {/* Ejection Port */}
      <mesh position={[0.027, 0.035, -0.04]} material={matteCarbon}>
        <boxGeometry args={[0.006, 0.028, 0.09]} />
      </mesh>
      <group ref={ejectionRef} position={[0.032, 0.035, -0.04]} rotation={[0, 0.5, 0]} />

      {/* --- LONG FLUTED SNIPER BARREL --- */}
      <mesh position={[0, 0.025, -0.52]} rotation={[Math.PI / 2, 0, 0]} material={heavySteel} castShadow>
        <cylinderGeometry args={[0.018, 0.022, 0.62, 16]} />
      </mesh>
      <mesh position={[0, 0.025, -0.5]} rotation={[Math.PI / 2, 0, 0]} material={flutedSteel}>
        <cylinderGeometry args={[0.019, 0.02, 0.45, 8]} />
      </mesh>

      {/* Massive Dual-Port Muzzle Brake */}
      <group position={[0, 0.025, -0.85]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={matteCarbon} castShadow>
          <boxGeometry args={[0.042, 0.065, 0.032]} />
        </mesh>
        <mesh position={[0.022, 0, -0.01]} material={flutedSteel}>
          <boxGeometry args={[0.004, 0.02, 0.018]} />
        </mesh>
        <mesh position={[-0.022, 0, -0.01]} material={flutedSteel}>
          <boxGeometry args={[0.004, 0.02, 0.018]} />
        </mesh>
      </group>

      {/* Muzzle Ref Anchor */}
      <group ref={muzzleRef} position={[0, 0.025, -0.89]} />

      {/* --- HEAVY BIPOD --- */}
      <group position={[0, -0.01, -0.58]}>
        <mesh material={heavySteel}>
          <cylinderGeometry args={[0.023, 0.023, 0.03, 12]} />
        </mesh>
        <mesh position={[-0.045, -0.1, 0.02]} rotation={[0.1, 0, 0.25]} material={matteCarbon}>
          <cylinderGeometry args={[0.006, 0.005, 0.18, 8]} />
        </mesh>
        <mesh position={[-0.07, -0.19, 0.03]} material={heavySteel}>
          <boxGeometry args={[0.016, 0.014, 0.02]} />
        </mesh>
        <mesh position={[0.045, -0.1, 0.02]} rotation={[0.1, 0, -0.25]} material={matteCarbon}>
          <cylinderGeometry args={[0.006, 0.005, 0.18, 8]} />
        </mesh>
        <mesh position={[0.07, -0.19, 0.03]} material={heavySteel}>
          <boxGeometry args={[0.016, 0.014, 0.02]} />
        </mesh>
      </group>

      {/* --- HIGH-MAGNIFICATION SNIPER SCOPE --- */}
      <group position={[0, 0.11, -0.05]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={heavySteel} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.28, 16]} />
        </mesh>
        <mesh position={[0, 0, -0.16]} rotation={[Math.PI / 2, 0, 0]} material={matteCarbon} castShadow>
          <cylinderGeometry args={[0.028, 0.02, 0.06, 16]} />
        </mesh>
        <mesh position={[0, 0, -0.195]} rotation={[Math.PI / 2, 0, 0]} material={neonAccent}>
          <cylinderGeometry args={[0.028, 0.028, 0.01, 16]} />
        </mesh>
        <mesh position={[0, 0, 0.14]} rotation={[Math.PI / 2, 0, 0]} material={matteCarbon} castShadow>
          <cylinderGeometry args={[0.024, 0.02, 0.05, 16]} />
        </mesh>
        <mesh position={[0, 0, 0.166]} rotation={[Math.PI / 2, 0, 0]} material={scopeGlass}>
          <cylinderGeometry args={[0.022, 0.022, 0.002, 16]} />
        </mesh>
        <mesh position={[0, 0, 0.164]} material={scopeReticle}>
          <ringGeometry args={[0.006, 0.008, 24]} />
        </mesh>

        <mesh position={[0, -0.03, -0.07]} material={heavySteel}>
          <boxGeometry args={[0.038, 0.04, 0.022]} />
        </mesh>
        <mesh position={[0, -0.03, 0.07]} material={heavySteel}>
          <boxGeometry args={[0.038, 0.04, 0.022]} />
        </mesh>

        <mesh position={[0, 0.026, 0]} material={heavySteel}>
          <cylinderGeometry args={[0.01, 0.01, 0.016, 12]} />
        </mesh>
        <mesh position={[0.024, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={heavySteel}>
          <cylinderGeometry args={[0.01, 0.01, 0.016, 12]} />
        </mesh>
      </group>

      {/* --- 5-ROUND BOX MAGAZINE --- */}
      <group position={[0, -0.07 + magYOffset, -0.02]}>
        <mesh material={matteCarbon} castShadow>
          <boxGeometry args={[0.036, 0.12, 0.08]} />
        </mesh>
        <mesh position={[0, -0.065, 0]} material={heavySteel}>
          <boxGeometry args={[0.038, 0.014, 0.084]} />
        </mesh>
      </group>

      {/* --- ERGONOMIC THUMBHOLE / CHASSIS GRIP --- */}
      <mesh position={[0, -0.08, 0.06]} rotation={[-0.4, 0, 0]} material={matteCarbon} castShadow>
        <boxGeometry args={[0.036, 0.12, 0.05]} />
      </mesh>
      <mesh position={[0, -0.06, 0.02]} material={heavySteel}>
        <torusGeometry args={[0.025, 0.003, 8, 16, Math.PI]} />
      </mesh>

      {/* --- PRECISION SNIPER STOCK --- */}
      <mesh position={[0, 0.015, 0.22]} material={heavySteel} castShadow>
        <boxGeometry args={[0.04, 0.07, 0.22]} />
      </mesh>
      <mesh position={[0, 0.07, 0.2]} material={matteCarbon}>
        <boxGeometry args={[0.034, 0.03, 0.12]} />
      </mesh>
      <mesh position={[0, 0.01, 0.335]} material={matteCarbon}>
        <boxGeometry args={[0.044, 0.13, 0.02]} />
      </mesh>
    </group>
  );
};
