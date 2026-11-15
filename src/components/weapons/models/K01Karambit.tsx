import React, { useRef } from 'react';
import * as THREE from 'three';

interface WeaponModelProps {
  isThirdPerson?: boolean;
  reloadProgress?: number;
  recoilProgress?: number;
  muzzleRef?: React.RefObject<THREE.Group>;
  ejectionRef?: React.RefObject<THREE.Group>;
}

export const K01Karambit: React.FC<WeaponModelProps> = ({
  isThirdPerson = false,
  recoilProgress = 0,
  muzzleRef,
}) => {
  const rootRef = useRef<THREE.Group>(null);

  // Materials
  const anodizedTigerBlade = new THREE.MeshStandardMaterial({
    color: 0x9922ee, // Iridescent purple/cyan anodized steel
    emissive: 0x330066,
    emissiveIntensity: 0.3,
    metalness: 0.95,
    roughness: 0.18,
  });

  const tigerStripeCyan = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    emissive: 0x0088aa,
    emissiveIntensity: 0.4,
    metalness: 0.9,
    roughness: 0.2,
  });

  const cuttingEdge = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.98,
    roughness: 0.1,
  });

  const g10Scales = new THREE.MeshStandardMaterial({
    color: 0x141618,
    metalness: 0.2,
    roughness: 0.8,
  });

  const torxScrew = new THREE.MeshStandardMaterial({
    color: 0xd8dde4,
    metalness: 0.9,
    roughness: 0.2,
  });

  // Melee attack animation tilt
  const swingRotX = recoilProgress * 0.8;
  const swingRotY = recoilProgress * -0.5;

  return (
    <group
      ref={rootRef}
      scale={isThirdPerson ? [0.85, 0.85, 0.85] : [1, 1, 1]}
      rotation={[swingRotX, swingRotY, 0]}
    >
      {/* --- REVERSE-GRIP HANDLE & SAFETY RING --- */}
      {/* Index Finger Safety Ring at Pommel */}
      <group position={[0, 0.08, 0]}>
        <mesh material={g10Scales} castShadow>
          <torusGeometry args={[0.02, 0.007, 12, 24]} />
        </mesh>
        <mesh material={tigerStripeCyan}>
          <torusGeometry args={[0.0205, 0.002, 8, 24]} />
        </mesh>
      </group>

      {/* Ergonomic Contoured Handle (Reverse Grip) */}
      <group position={[0, 0, 0]} rotation={[0.08, 0, 0]}>
        {/* Main Handle Body */}
        <mesh material={g10Scales} castShadow>
          <boxGeometry args={[0.024, 0.12, 0.038]} />
        </mesh>

        {/* Finger Grooves along the front of the handle */}
        {[0.03, 0, -0.03].map((y, idx) => (
          <mesh key={idx} position={[0, y, 0.018]} material={g10Scales}>
            <cylinderGeometry args={[0.012, 0.012, 0.015, 12]} />
          </mesh>
        ))}

        {/* Torx Hardware Screws */}
        {[0.035, -0.01, -0.045].map((y, idx) => (
          <group key={`s-${idx}`}>
            <mesh position={[0.013, y, 0]} rotation={[0, 0, Math.PI / 2]} material={torxScrew}>
              <cylinderGeometry args={[0.0035, 0.0035, 0.002, 8]} />
            </mesh>
            <mesh position={[-0.013, y, 0]} rotation={[0, 0, Math.PI / 2]} material={torxScrew}>
              <cylinderGeometry args={[0.0035, 0.0035, 0.002, 8]} />
            </mesh>
          </group>
        ))}
      </group>

      {/* --- CURVED HAWKBILL CLAW BLADE --- */}
      <group position={[0, -0.07, -0.01]}>
        {/* Blade Base / Tang */}
        <mesh position={[0, -0.02, -0.015]} material={anodizedTigerBlade} castShadow>
          <boxGeometry args={[0.006, 0.05, 0.04]} />
        </mesh>

        {/* Curved Claw Segments forming Hawkbill profile */}
        {/* Segment 1 */}
        <mesh
          position={[0, -0.05, -0.035]}
          rotation={[0.3, 0, 0]}
          material={anodizedTigerBlade}
          castShadow
        >
          <boxGeometry args={[0.005, 0.045, 0.032]} />
        </mesh>

        {/* Tiger Stripe Accents */}
        <mesh position={[0.003, -0.05, -0.035]} rotation={[0.3, 0, 0]} material={tigerStripeCyan}>
          <boxGeometry args={[0.001, 0.012, 0.034]} />
        </mesh>

        {/* Segment 2 (Curving sharply downward & forward) */}
        <mesh
          position={[0, -0.08, -0.065]}
          rotation={[0.65, 0, 0]}
          material={anodizedTigerBlade}
          castShadow
        >
          <boxGeometry args={[0.004, 0.045, 0.026]} />
        </mesh>

        {/* Segment 3 (Razor Needle Tip) */}
        <mesh
          position={[0, -0.105, -0.095]}
          rotation={[1.05, 0, 0]}
          material={cuttingEdge}
          castShadow
        >
          <coneGeometry args={[0.008, 0.05, 4]} />
        </mesh>

        {/* Razor Sharp Curved Edge (Polished Silver Bevel) */}
        <mesh
          position={[0, -0.075, -0.05]}
          rotation={[0.5, 0, 0]}
          material={cuttingEdge}
        >
          <boxGeometry args={[0.002, 0.085, 0.004]} />
        </mesh>

        {/* Spine Jimping along the back */}
        {[-0.01, -0.025, -0.04].map((z, idx) => (
          <mesh key={idx} position={[0, -0.01, z]} material={torxScrew}>
            <boxGeometry args={[0.007, 0.004, 0.004]} />
          </mesh>
        ))}

        {/* Blade Tip Hit/Slash Ref Anchor */}
        <group ref={muzzleRef} position={[0, -0.12, -0.11]} />
      </group>
    </group>
  );
};
