import React, { useRef } from 'react';
import * as THREE from 'three';

interface WeaponModelProps {
  isThirdPerson?: boolean;
  reloadProgress?: number; // 0 to 1
  recoilProgress?: number; // 0 to 1
  muzzleRef?: React.RefObject<THREE.Group>;
  ejectionRef?: React.RefObject<THREE.Group>;
}

export const AR76Vandal: React.FC<WeaponModelProps> = ({
  isThirdPerson = false,
  reloadProgress = 0,
  recoilProgress = 0,
  muzzleRef,
  ejectionRef,
}) => {
  const rootRef = useRef<THREE.Group>(null);

  // Materials
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x1b1f24,
    metalness: 0.85,
    roughness: 0.25,
  });

  const gunmetal = new THREE.MeshStandardMaterial({
    color: 0x2b313a,
    metalness: 0.9,
    roughness: 0.35,
  });

  const receiverUpper = new THREE.MeshStandardMaterial({
    color: 0x232830,
    metalness: 0.75,
    roughness: 0.4,
  });

  const gripPolymer = new THREE.MeshStandardMaterial({
    color: 0x141619,
    metalness: 0.1,
    roughness: 0.85,
  });

  const goldAccent = new THREE.MeshStandardMaterial({
    color: 0xc89632,
    metalness: 0.95,
    roughness: 0.2,
  });

  const holoGlass = new THREE.MeshPhysicalMaterial({
    color: 0x2288ff,
    metalness: 0.1,
    roughness: 0.05,
    transmission: 0.85,
    transparent: true,
    opacity: 0.4,
  });

  const holoReticle = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.95,
  });

  // Calculate magazine animation based on reloadProgress
  // 0 - 0.2: in place
  // 0.2 - 0.4: drops down
  // 0.4 - 0.7: below receiver
  // 0.7 - 0.9: pushes back up
  // 0.9 - 1.0: in place
  let magYOffset = 0;
  let magZOffset = 0;
  let magRotX = 0;

  if (reloadProgress > 0.15 && reloadProgress < 0.85) {
    if (reloadProgress < 0.4) {
      const t = (reloadProgress - 0.15) / 0.25;
      magYOffset = -t * 0.35;
      magZOffset = -t * 0.05;
      magRotX = t * 0.3;
    } else if (reloadProgress < 0.6) {
      magYOffset = -0.35;
      magZOffset = -0.05;
      magRotX = 0.3;
    } else {
      const t = 1 - (reloadProgress - 0.6) / 0.25;
      magYOffset = -t * 0.35;
      magZOffset = -t * 0.05;
      magRotX = t * 0.3;
    }
  }

  // Recoil bolt push
  const boltZ = recoilProgress * 0.04;

  return (
    <group ref={rootRef} scale={isThirdPerson ? [0.85, 0.85, 0.85] : [1, 1, 1]}>
      {/* --- RECEIVER --- */}
      {/* Lower Receiver */}
      <mesh position={[0, -0.02, -0.05]} material={receiverUpper} castShadow>
        <boxGeometry args={[0.048, 0.075, 0.24]} />
      </mesh>

      {/* Upper Receiver */}
      <mesh position={[0, 0.035, -0.06]} material={darkMetal} castShadow>
        <boxGeometry args={[0.046, 0.055, 0.28]} />
      </mesh>

      {/* Top Picatinny Rail */}
      <mesh position={[0, 0.068, -0.06]} material={gunmetal} castShadow>
        <boxGeometry args={[0.032, 0.012, 0.32]} />
      </mesh>
      {/* Rail notches */}
      {[-0.18, -0.14, -0.1, -0.06, -0.02, 0.02, 0.06].map((z, idx) => (
        <mesh key={idx} position={[0, 0.074, z]} material={darkMetal}>
          <boxGeometry args={[0.034, 0.004, 0.01]} />
        </mesh>
      ))}

      {/* Ejection Port */}
      <mesh position={[0.025, 0.04, -0.04]} material={darkMetal}>
        <boxGeometry args={[0.006, 0.025, 0.07]} />
      </mesh>
      {/* Internal Bolt carrier (recoils) */}
      <mesh position={[0.02, 0.04, -0.04 + boltZ]} material={goldAccent}>
        <boxGeometry args={[0.005, 0.02, 0.05]} />
      </mesh>

      {/* Ejection Ref Node for Shell Casings */}
      <group ref={ejectionRef} position={[0.03, 0.04, -0.04]} rotation={[0, 0.4, 0]} />

      {/* --- BARREL & HANDGUARD --- */}
      {/* Tactical Handguard / Shroud */}
      <mesh position={[0, 0.032, -0.28]} material={darkMetal} castShadow>
        <boxGeometry args={[0.044, 0.058, 0.2]} />
      </mesh>
      {/* Handguard M-LOK slots */}
      {[-0.22, -0.28, -0.34].map((z, i) => (
        <group key={i}>
          <mesh position={[0.023, 0.032, z]} material={gripPolymer}>
            <boxGeometry args={[0.002, 0.018, 0.035]} />
          </mesh>
          <mesh position={[-0.023, 0.032, z]} material={gripPolymer}>
            <boxGeometry args={[0.002, 0.018, 0.035]} />
          </mesh>
        </group>
      ))}

      {/* Outer Barrel */}
      <mesh position={[0, 0.032, -0.45]} rotation={[Math.PI / 2, 0, 0]} material={gunmetal} castShadow>
        <cylinderGeometry args={[0.012, 0.012, 0.22, 16]} />
      </mesh>

      {/* Gas Block & Gas Tube */}
      <mesh position={[0, 0.052, -0.34]} material={darkMetal}>
        <boxGeometry args={[0.018, 0.022, 0.05]} />
      </mesh>
      <mesh position={[0, 0.052, -0.22]} rotation={[Math.PI / 2, 0, 0]} material={goldAccent}>
        <cylinderGeometry args={[0.004, 0.004, 0.18, 8]} />
      </mesh>

      {/* Muzzle Brake / Flash Hider */}
      <mesh position={[0, 0.032, -0.57]} rotation={[Math.PI / 2, 0, 0]} material={darkMetal} castShadow>
        <cylinderGeometry args={[0.016, 0.014, 0.05, 12]} />
      </mesh>
      {/* Muzzle Crown Ports */}
      <mesh position={[0, 0.032, -0.595]} rotation={[Math.PI / 2, 0, 0]} material={goldAccent}>
        <cylinderGeometry args={[0.015, 0.015, 0.008, 12]} />
      </mesh>

      {/* Muzzle Ref Anchor for Tracer & Flash */}
      <group ref={muzzleRef} position={[0, 0.032, -0.61]} />

      {/* --- HOLOGRAPHIC SIGHT --- */}
      {/* Optic Base Mount */}
      <mesh position={[0, 0.08, -0.05]} material={darkMetal}>
        <boxGeometry args={[0.038, 0.015, 0.09]} />
      </mesh>
      {/* Optic Protective Hood */}
      <mesh position={[0, 0.115, -0.05]} material={darkMetal} castShadow>
        <boxGeometry args={[0.046, 0.055, 0.095]} />
      </mesh>
      {/* Optic Hollow Viewing Channel */}
      <mesh position={[0, 0.115, -0.05]} material={gripPolymer}>
        <boxGeometry args={[0.034, 0.04, 0.1]} />
      </mesh>
      {/* Holographic Lens Glass */}
      <mesh position={[0, 0.115, -0.04]} material={holoGlass}>
        <boxGeometry args={[0.032, 0.038, 0.002]} />
      </mesh>
      {/* Glowing Reticle Dot */}
      <mesh position={[0, 0.115, -0.041]} material={holoReticle}>
        <ringGeometry args={[0.0025, 0.0045, 16]} />
      </mesh>
      <mesh position={[0, 0.115, -0.041]} material={holoReticle}>
        <circleGeometry args={[0.001, 8]} />
      </mesh>

      {/* --- MAGAZINE --- */}
      <group position={[0, -0.07 + magYOffset, -0.03 + magZOffset]} rotation={[magRotX, 0, 0]}>
        {/* Curved Banana Magazine */}
        <mesh position={[0, -0.06, -0.03]} rotation={[0.22, 0, 0]} material={gripPolymer} castShadow>
          <boxGeometry args={[0.036, 0.15, 0.075]} />
        </mesh>
        {/* Magazine Ribs */}
        {[-0.03, -0.06, -0.09].map((y, idx) => (
          <mesh key={idx} position={[0, y, -0.03 - (y + 0.06) * 0.22]} rotation={[0.22, 0, 0]} material={darkMetal}>
            <boxGeometry args={[0.038, 0.008, 0.077]} />
          </mesh>
        ))}
        {/* Magazine Baseplate */}
        <mesh position={[0, -0.135, -0.012]} rotation={[0.22, 0, 0]} material={goldAccent}>
          <boxGeometry args={[0.038, 0.014, 0.08]} />
        </mesh>
      </group>

      {/* --- ERGONOMIC PISTOL GRIP --- */}
      <group position={[0, -0.075, 0.06]} rotation={[-0.35, 0, 0]}>
        <mesh material={gripPolymer} castShadow>
          <boxGeometry args={[0.036, 0.11, 0.05]} />
        </mesh>
        {/* Texture lines */}
        {[-0.03, 0, 0.03].map((y, idx) => (
          <mesh key={idx} position={[0, y, 0.026]} material={darkMetal}>
            <boxGeometry args={[0.034, 0.006, 0.003]} />
          </mesh>
        ))}
      </group>

      {/* Trigger Guard & Trigger */}
      <mesh position={[0, -0.065, 0.02]} material={darkMetal}>
        <torusGeometry args={[0.022, 0.003, 8, 16, Math.PI]} />
      </mesh>
      <mesh position={[0, -0.055, 0.025]} rotation={[0.3, 0, 0]} material={goldAccent}>
        <boxGeometry args={[0.004, 0.02, 0.006]} />
      </mesh>

      {/* --- TACTICAL STOCK --- */}
      {/* Buffer Tube */}
      <mesh position={[0, 0.035, 0.12]} rotation={[Math.PI / 2, 0, 0]} material={darkMetal} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.15, 16]} />
      </mesh>
      {/* CTR Stock Body */}
      <mesh position={[0, 0.015, 0.19]} material={gripPolymer} castShadow>
        <boxGeometry args={[0.042, 0.09, 0.14]} />
      </mesh>
      {/* Buttpad */}
      <mesh position={[0, 0.01, 0.265]} material={darkMetal}>
        <boxGeometry args={[0.044, 0.115, 0.015]} />
      </mesh>
    </group>
  );
};
