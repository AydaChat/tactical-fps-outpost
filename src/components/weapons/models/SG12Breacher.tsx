import React, { useRef } from 'react';
import * as THREE from 'three';

interface WeaponModelProps {
  isThirdPerson?: boolean;
  reloadProgress?: number;
  recoilProgress?: number;
  muzzleRef?: React.RefObject<THREE.Group>;
  ejectionRef?: React.RefObject<THREE.Group>;
}

export const SG12Breacher: React.FC<WeaponModelProps> = ({
  isThirdPerson = false,
  reloadProgress = 0,
  recoilProgress = 0,
  muzzleRef,
  ejectionRef,
}) => {
  const rootRef = useRef<THREE.Group>(null);

  // Materials
  const darkPolymer = new THREE.MeshStandardMaterial({
    color: 0x1a1c1e,
    metalness: 0.2,
    roughness: 0.8,
  });

  const parkerizedSteel = new THREE.MeshStandardMaterial({
    color: 0x2a2e33,
    metalness: 0.85,
    roughness: 0.35,
  });

  const hazardOrange = new THREE.MeshStandardMaterial({
    color: 0xff5500,
    metalness: 0.3,
    roughness: 0.4,
  });

  const fiberOptic = new THREE.MeshBasicMaterial({
    color: 0x33ff00,
  });

  // Pump Action slide animation:
  // After firing, pump slides back (0.2 - 0.5) and forward (0.5 - 0.8)
  let pumpZ = 0;
  if (recoilProgress > 0.15 && recoilProgress < 0.85) {
    if (recoilProgress < 0.5) {
      const t = (recoilProgress - 0.15) / 0.35;
      pumpZ = t * 0.08;
    } else {
      const t = 1 - (recoilProgress - 0.5) / 0.35;
      pumpZ = t * 0.08;
    }
  }

  // Shell insert animation during reload
  let shellInsertOffset = 0;
  if (reloadProgress > 0.3 && reloadProgress < 0.7) {
    shellInsertOffset = Math.sin((reloadProgress - 0.3) / 0.4 * Math.PI) * 0.05;
  }

  return (
    <group ref={rootRef} scale={isThirdPerson ? [0.85, 0.85, 0.85] : [1, 1, 1]}>
      {/* --- RECEIVER --- */}
      <mesh position={[0, 0.02, -0.06]} material={parkerizedSteel} castShadow>
        <boxGeometry args={[0.052, 0.082, 0.28]} />
      </mesh>

      {/* Top Ghost Ring Sight */}
      <group position={[0, 0.068, 0.02]}>
        <mesh material={parkerizedSteel}>
          <boxGeometry args={[0.024, 0.016, 0.018]} />
        </mesh>
        <mesh position={[0, 0.008, 0]} material={parkerizedSteel}>
          <torusGeometry args={[0.007, 0.002, 8, 16]} />
        </mesh>
      </group>

      {/* Ejection Port */}
      <mesh position={[0.027, 0.03, -0.05]} material={darkPolymer}>
        <boxGeometry args={[0.005, 0.03, 0.08]} />
      </mesh>
      <group ref={ejectionRef} position={[0.032, 0.03, -0.05]} rotation={[0, 0.4, 0]} />

      {/* Bottom Loading Port / Shell lifter */}
      <mesh position={[0, -0.022 + shellInsertOffset, -0.04]} material={hazardOrange}>
        <boxGeometry args={[0.024, 0.008, 0.065]} />
      </mesh>

      {/* --- BARREL & TUBULAR MAGAZINE --- */}
      {/* Main 12-Gauge Barrel (Top) */}
      <mesh position={[0, 0.04, -0.42]} rotation={[Math.PI / 2, 0, 0]} material={parkerizedSteel} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.46, 16]} />
      </mesh>

      {/* Under-Barrel Magazine Tube (Bottom) */}
      <mesh position={[0, 0.008, -0.38]} rotation={[Math.PI / 2, 0, 0]} material={parkerizedSteel} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.38, 16]} />
      </mesh>
      {/* Magazine Cap */}
      <mesh position={[0, 0.008, -0.57]} rotation={[Math.PI / 2, 0, 0]} material={hazardOrange}>
        <cylinderGeometry args={[0.016, 0.016, 0.015, 12]} />
      </mesh>

      {/* Ventilated Heat Shield */}
      <mesh position={[0, 0.048, -0.36]} material={parkerizedSteel} castShadow>
        <boxGeometry args={[0.038, 0.026, 0.32]} />
      </mesh>
      {/* Heat Shield Vent Holes */}
      {[-0.24, -0.28, -0.32, -0.36, -0.4, -0.44, -0.48].map((z, idx) => (
        <mesh key={idx} position={[0, 0.062, z]} rotation={[0, 0, 0]} material={darkPolymer}>
          <cylinderGeometry args={[0.004, 0.004, 0.004, 8]} />
        </mesh>
      ))}

      {/* --- RIBBED PUMP SLIDE (Forend) --- */}
      <group position={[0, 0.008, -0.32 + pumpZ]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={darkPolymer} castShadow>
          <cylinderGeometry args={[0.025, 0.025, 0.2, 16]} />
        </mesh>
        {/* Grip Ribs */}
        {[-0.07, -0.04, -0.01, 0.02, 0.05, 0.08].map((z, idx) => (
          <mesh key={idx} position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]} material={hazardOrange}>
            <torusGeometry args={[0.0255, 0.002, 8, 16]} />
          </mesh>
        ))}
      </group>

      {/* --- AGGRESSIVE BREACHER MUZZLE CHOKE --- */}
      <group position={[0, 0.04, -0.66]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={parkerizedSteel} castShadow>
          <cylinderGeometry args={[0.018, 0.016, 0.05, 12]} />
        </mesh>
        {/* Jagged Breaching Teeth */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
          <mesh
            key={idx}
            position={[Math.cos(angle) * 0.014, Math.sin(angle) * 0.014, -0.03]}
            rotation={[Math.PI / 2, 0, angle]}
            material={parkerizedSteel}
          >
            <coneGeometry args={[0.004, 0.014, 4]} />
          </mesh>
        ))}
        {/* Front Fiber-Optic Sight Post */}
        <mesh position={[0, 0.024, -0.01]} material={fiberOptic}>
          <cylinderGeometry args={[0.002, 0.002, 0.015, 8]} />
        </mesh>
      </group>

      {/* Muzzle Ref Anchor */}
      <group ref={muzzleRef} position={[0, 0.04, -0.7]} />

      {/* --- GRIP & TACTICAL STOCK --- */}
      <group position={[0, -0.07, 0.06]} rotation={[-0.35, 0, 0]}>
        <mesh material={darkPolymer} castShadow>
          <boxGeometry args={[0.036, 0.11, 0.048]} />
        </mesh>
      </group>
      <mesh position={[0, -0.05, 0.02]} material={parkerizedSteel}>
        <torusGeometry args={[0.02, 0.003, 8, 16, Math.PI]} />
      </mesh>

      {/* Solid Polymer Stock */}
      <mesh position={[0, -0.01, 0.2]} material={darkPolymer} castShadow>
        <boxGeometry args={[0.042, 0.09, 0.24]} />
      </mesh>
      {/* Stock Cheek Contour */}
      <mesh position={[0, 0.045, 0.16]} material={darkPolymer}>
        <boxGeometry args={[0.036, 0.025, 0.14]} />
      </mesh>
      {/* Recoil Rubber Pad */}
      <mesh position={[0, -0.01, 0.325]} material={hazardOrange}>
        <boxGeometry args={[0.046, 0.11, 0.015]} />
      </mesh>
    </group>
  );
};
