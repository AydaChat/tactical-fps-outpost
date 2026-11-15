'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PlayerState, Team, WeaponId } from '@/types/game';
import { WeaponModel } from '../weapons/WeaponModel';

interface ThirdPersonPlayerProps {
  player: PlayerState;
}

export const ThirdPersonPlayer: React.FC<ThirdPersonPlayerProps> = ({ player }) => {
  const rootGroupRef = useRef<THREE.Group>(null);
  const torsoGroupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const muzzleFlashRef = useRef<THREE.PointLight>(null);
  const billboardRef = useRef<THREE.Group>(null);

  // Target positions & rotations for netcode interpolation
  const targetPos = useRef<THREE.Vector3>(
    new THREE.Vector3(player.position.x, player.position.y, player.position.z)
  );
  const currentPos = useRef<THREE.Vector3>(
    new THREE.Vector3(player.position.x, player.position.y, player.position.z)
  );

  const targetYaw = useRef<number>(player.rotation.y || 0);
  const currentYaw = useRef<number>(player.rotation.y || 0);
  const targetPitch = useRef<number>(player.rotation.x || 0);
  const currentPitch = useRef<number>(player.rotation.x || 0);

  const walkCycleRef = useRef<number>(0);

  // Update target coordinates whenever player prop updates
  targetPos.current.set(player.position.x, player.position.y, player.position.z);
  targetYaw.current = player.rotation.y || 0;
  targetPitch.current = player.rotation.x || 0;

  // Determine team color accents
  const teamColors = useMemo(() => {
    switch (player.team) {
      case 'ALPHA':
        return {
          primary: '#0284c7', // Ocean Blue
          accent: '#06b6d4', // Cyan
          emissive: '#22d3ee', // Bright Cyan Glow
          armor: '#1e293b', // Slate Charcoal
          visor: '#00f0ff',
        };
      case 'BRAVO':
        return {
          primary: '#dc2626', // Crimson Red
          accent: '#ea580c', // Orange
          emissive: '#f97316', // Bright Amber Glow
          armor: '#18181b', // Carbon Black
          visor: '#ff3344',
        };
      case 'FFA':
      default:
        return {
          primary: '#d97706', // Gold Amber
          accent: '#eab308', // Yellow
          emissive: '#fde047', // Yellow Glow
          armor: '#1e1e24', // Dystopian Gray
          visor: '#fbbf24',
        };
    }
  }, [player.team]);

  // Netcode Interpolation & Animation Frame Loop
  useFrame((state, delta) => {
    if (!rootGroupRef.current) return;

    // Smoothly lerp position & rotation from network ticks
    currentPos.current.lerp(targetPos.current, THREE.MathUtils.clamp(delta * 18, 0, 1));
    currentYaw.current = THREE.MathUtils.lerp(
      currentYaw.current,
      targetYaw.current,
      THREE.MathUtils.clamp(delta * 18, 0, 1)
    );
    currentPitch.current = THREE.MathUtils.lerp(
      currentPitch.current,
      targetPitch.current,
      THREE.MathUtils.clamp(delta * 18, 0, 1)
    );

    // Apply root position
    rootGroupRef.current.position.copy(currentPos.current);
    rootGroupRef.current.rotation.y = currentYaw.current;

    // Pitch head & upper arms with view pitch
    if (headGroupRef.current) {
      headGroupRef.current.rotation.x = currentPitch.current * 0.8;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = -Math.PI / 2.3 + currentPitch.current * 0.7;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = -Math.PI / 2.5 + currentPitch.current * 0.7;
    }

    // Check if moving (based on velocity or position change)
    const velX = player.velocity?.x || 0;
    const velZ = player.velocity?.z || 0;
    const speed = Math.hypot(velX, velZ);
    const isMoving = speed > 0.3 || currentPos.current.distanceTo(targetPos.current) > 0.05;

    // Procedural leg walking animation
    if (isMoving && !player.isDead) {
      const walkSpeed = player.isSprinting ? 14 : 9;
      walkCycleRef.current += delta * walkSpeed;

      const legAngle = Math.sin(walkCycleRef.current) * (player.isSprinting ? 0.65 : 0.45);
      if (leftLegRef.current) leftLegRef.current.rotation.x = legAngle;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -legAngle;

      // Slight torso bobbing
      if (torsoGroupRef.current) {
        torsoGroupRef.current.position.y =
          (player.isCrouching ? 0.6 : 0.95) + Math.abs(Math.sin(walkCycleRef.current * 2)) * 0.04;
      }
    } else {
      // Idle pose reset
      if (leftLegRef.current) {
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(
          leftLegRef.current.rotation.x,
          0,
          delta * 10
        );
      }
      if (rightLegRef.current) {
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(
          rightLegRef.current.rotation.x,
          0,
          delta * 10
        );
      }
      if (torsoGroupRef.current) {
        torsoGroupRef.current.position.y = THREE.MathUtils.lerp(
          torsoGroupRef.current.position.y,
          player.isCrouching ? 0.6 : 0.95,
          delta * 10
        );
      }
    }

    // Muzzle flash visibility when firing
    if (muzzleFlashRef.current) {
      muzzleFlashRef.current.intensity = player.isFiring ? 4.0 : 0.0;
    }

    // Billboard overhead tag always faces the camera
    if (billboardRef.current) {
      billboardRef.current.quaternion.copy(state.camera.quaternion);
    }
  });

  // Calculate health & armor bar percentages
  const healthPercent = Math.max(0, Math.min(1, (player.health ?? 100) / 100));
  const armorPercent = Math.max(0, Math.min(1, (player.armor ?? 0) / 100));

  if (player.isDead) {
    // Render downed / elimination marker or flat ragdoll box
    return (
      <group ref={rootGroupRef} position={[player.position.x, player.position.y, player.position.z]}>
        <mesh position={[0, 0.15, 0]}>
          <boxGeometry args={[0.8, 0.3, 1.6]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={rootGroupRef}>
      {/* ================================================================== */}
      {/* 1. FLOATING OVERHEAD BILLBOARD (NAME TAG & HEALTH / ARMOR BARS)    */}
      {/* ================================================================== */}
      <group ref={billboardRef} position={[0, 2.25, 0]}>
        {/* Background plate */}
        <mesh position={[0, 0, -0.01]}>
          <planeGeometry args={[1.6, 0.42]} />
          <meshBasicMaterial color="#090d16" transparent opacity={0.82} />
        </mesh>

        {/* Outer team colored border */}
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(1.6, 0.42)]} />
          <lineBasicMaterial color={teamColors.accent} />
        </lineSegments>

        {/* Health Bar Background */}
        <mesh position={[0, -0.06, 0]}>
          <planeGeometry args={[1.4, 0.09]} />
          <meshBasicMaterial color="#1f2937" />
        </mesh>
        {/* Health Bar Current Fill (Green -> Yellow -> Red) */}
        <mesh
          position={[-0.7 + (1.4 * healthPercent) / 2, -0.06, 0.005]}
          scale={[healthPercent, 1, 1]}
        >
          <planeGeometry args={[1.4, 0.09]} />
          <meshBasicMaterial
            color={
              healthPercent > 0.5 ? '#10b981' : healthPercent > 0.25 ? '#f59e0b' : '#ef4444'
            }
          />
        </mesh>

        {/* Armor Bar Background */}
        <mesh position={[0, -0.15, 0]}>
          <planeGeometry args={[1.4, 0.04]} />
          <meshBasicMaterial color="#111827" />
        </mesh>
        {/* Armor Bar Current Fill (Cyan) */}
        {armorPercent > 0 && (
          <mesh
            position={[-0.7 + (1.4 * armorPercent) / 2, -0.15, 0.005]}
            scale={[armorPercent, 1, 1]}
          >
            <planeGeometry args={[1.4, 0.04]} />
            <meshBasicMaterial color="#06b6d4" />
          </mesh>
        )}
      </group>

      {/* ================================================================== */}
      {/* 2. LEGS & LOWER BODY                                               */}
      {/* ================================================================== */}
      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.2, 0.65, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.18, 0.42, 0.2]} />
          <meshStandardMaterial color={teamColors.armor} roughness={0.7} metalness={0.4} />
        </mesh>
        {/* Knee Pad */}
        <mesh position={[0, -0.38, 0.1]}>
          <boxGeometry args={[0.16, 0.12, 0.08]} />
          <meshStandardMaterial color={teamColors.primary} roughness={0.5} />
        </mesh>
        {/* Shin & Heavy Combat Boot */}
        <mesh position={[0, -0.55, 0.03]} castShadow>
          <boxGeometry args={[0.19, 0.35, 0.24]} />
          <meshStandardMaterial color="#0b0f19" roughness={0.8} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.2, 0.65, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <boxGeometry args={[0.18, 0.42, 0.2]} />
          <meshStandardMaterial color={teamColors.armor} roughness={0.7} metalness={0.4} />
        </mesh>
        {/* Knee Pad */}
        <mesh position={[0, -0.38, 0.1]}>
          <boxGeometry args={[0.16, 0.12, 0.08]} />
          <meshStandardMaterial color={teamColors.primary} roughness={0.5} />
        </mesh>
        {/* Shin & Heavy Combat Boot */}
        <mesh position={[0, -0.55, 0.03]} castShadow>
          <boxGeometry args={[0.19, 0.35, 0.24]} />
          <meshStandardMaterial color="#0b0f19" roughness={0.8} />
        </mesh>
      </group>

      {/* ================================================================== */}
      {/* 3. TORSO, ARMOR & BACKPACK                                         */}
      {/* ================================================================== */}
      <group ref={torsoGroupRef} position={[0, 0.95, 0]}>
        {/* Pelvis & Tactical Utility Belt */}
        <mesh position={[0, -0.25, 0]} castShadow>
          <boxGeometry args={[0.48, 0.18, 0.28]} />
          <meshStandardMaterial color="#0b0f19" roughness={0.8} />
        </mesh>
        {/* Ammo Pouches */}
        <mesh position={[-0.18, -0.25, 0.15]}>
          <boxGeometry args={[0.1, 0.1, 0.06]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0.18, -0.25, 0.15]}>
          <boxGeometry args={[0.1, 0.1, 0.06]} />
          <meshStandardMaterial color="#334155" />
        </mesh>

        {/* Main Chestplate Body */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.54, 0.48, 0.32]} />
          <meshStandardMaterial color={teamColors.armor} roughness={0.6} metalness={0.5} />
        </mesh>

        {/* Front Ballistic Chest Armor Plate */}
        <mesh position={[0, 0.08, 0.16]}>
          <boxGeometry args={[0.42, 0.34, 0.06]} />
          <meshStandardMaterial color={teamColors.primary} roughness={0.4} metalness={0.7} />
        </mesh>
        {/* Emissive Center Insignia Strip */}
        <mesh position={[0, 0.08, 0.195]}>
          <boxGeometry args={[0.06, 0.26, 0.02]} />
          <meshBasicMaterial color={teamColors.emissive} />
        </mesh>

        {/* Armored Shoulder Pauldrons */}
        <mesh position={[-0.34, 0.2, 0]} castShadow>
          <boxGeometry args={[0.2, 0.18, 0.24]} />
          <meshStandardMaterial color={teamColors.primary} roughness={0.5} metalness={0.6} />
        </mesh>
        <mesh position={[0.34, 0.2, 0]} castShadow>
          <boxGeometry args={[0.2, 0.18, 0.24]} />
          <meshStandardMaterial color={teamColors.primary} roughness={0.5} metalness={0.6} />
        </mesh>

        {/* Tactical Jump Thruster Back Pack */}
        <group position={[0, 0.08, -0.2]}>
          <mesh castShadow>
            <boxGeometry args={[0.38, 0.42, 0.14]} />
            <meshStandardMaterial color="#111827" roughness={0.7} metalness={0.7} />
          </mesh>
          {/* Dual Jump Jet Exhaust Nozzles */}
          <mesh position={[-0.1, -0.18, 0]}>
            <cylinderGeometry args={[0.06, 0.05, 0.1, 12]} />
            <meshBasicMaterial color={teamColors.emissive} />
          </mesh>
          <mesh position={[0.1, -0.18, 0]}>
            <cylinderGeometry args={[0.06, 0.05, 0.1, 12]} />
            <meshBasicMaterial color={teamColors.emissive} />
          </mesh>
        </group>

        {/* ================================================================ */}
        {/* 4. HEAD & TACTICAL HELMET                                        */}
        {/* ================================================================ */}
        <group ref={headGroupRef} position={[0, 0.42, 0]}>
          {/* Neck */}
          <mesh position={[0, -0.06, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 0.12, 12]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          {/* Main Helmet Dome */}
          <mesh position={[0, 0.08, 0]} castShadow>
            <boxGeometry args={[0.32, 0.32, 0.34]} />
            <meshStandardMaterial color={teamColors.armor} roughness={0.5} metalness={0.7} />
          </mesh>
          {/* Glowing Curved Visor Shield */}
          <mesh position={[0, 0.06, 0.16]}>
            <boxGeometry args={[0.26, 0.13, 0.05]} />
            <meshStandardMaterial
              color={teamColors.visor}
              emissive={teamColors.visor}
              emissiveIntensity={2.8}
              roughness={0.1}
              metalness={0.9}
            />
          </mesh>
          {/* Tactical Helmet Comms Earpiece & Antenna */}
          <mesh position={[-0.18, 0.08, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.08, 8]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[-0.18, 0.22, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 0.22, 6]} />
            <meshBasicMaterial color="#94a3b8" />
          </mesh>
        </group>

        {/* ================================================================ */}
        {/* 5. ARMS & HELD 3D WEAPON MODEL                                   */}
        {/* ================================================================ */}
        {/* Left Arm (Support Hand) */}
        <group ref={leftArmRef} position={[-0.32, 0.2, 0.05]}>
          <mesh position={[0.1, 0, 0.28]} rotation={[0.4, -0.3, 0]}>
            <cylinderGeometry args={[0.07, 0.08, 0.5, 10]} />
            <meshStandardMaterial color={teamColors.armor} roughness={0.6} />
          </mesh>
        </group>

        {/* Right Arm & Held Weapon */}
        <group ref={rightArmRef} position={[0.3, 0.2, 0.05]}>
          {/* Arm Sleeve */}
          <mesh position={[-0.05, 0, 0.25]} rotation={[0.2, 0.1, 0]}>
            <cylinderGeometry args={[0.07, 0.08, 0.48, 10]} />
            <meshStandardMaterial color={teamColors.armor} roughness={0.6} />
          </mesh>

          {/* Procedural 3D Weapon in Hands */}
          <group position={[-0.18, -0.05, 0.48]}>
            <WeaponModel weaponId={player.currentWeapon} isThirdPerson={true} />

            {/* Muzzle Flash Point Light */}
            <pointLight
              ref={muzzleFlashRef}
              color="#fbbf24"
              intensity={0}
              distance={8}
              decay={2}
              position={[0, 0.08, 0.85]}
            />
          </group>
        </group>
      </group>
    </group>
  );
};

// ----------------------------------------------------------------------------
// Procedural 3D Weapon Models for 3rd Person Soldier Hands
// ----------------------------------------------------------------------------
const Weapon3DModel: React.FC<{ weaponId?: WeaponId }> = ({ weaponId = 'AR-76' }) => {
  switch (weaponId) {
    case 'SR-99': // Sniper Rifle
      return (
        <group>
          {/* Long Receiver & Barrel */}
          <mesh position={[0, 0, 0.2]}>
            <boxGeometry args={[0.09, 0.14, 0.85]} />
            <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.8} />
          </mesh>
          {/* Barrel & Muzzle Shroud */}
          <mesh position={[0, 0.03, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.55, 8]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} />
          </mesh>
          {/* Sniper Scope */}
          <mesh position={[0, 0.12, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.038, 0.035, 0.32, 12]} />
            <meshStandardMaterial color="#0369a1" roughness={0.2} metalness={0.8} />
          </mesh>
        </group>
      );

    case 'SMG-9': // Submachine Gun
      return (
        <group>
          {/* Compact Frame */}
          <mesh position={[0, 0, 0.1]}>
            <boxGeometry args={[0.08, 0.12, 0.45]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.8} />
          </mesh>
          {/* Curved Forward Mag */}
          <mesh position={[0, -0.12, 0.18]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.05, 0.2, 0.08]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
        </group>
      );

    case 'SG-12': // Shotgun
      return (
        <group>
          {/* Heavy Receiver */}
          <mesh position={[0, 0, 0.15]}>
            <boxGeometry args={[0.11, 0.15, 0.65]} />
            <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.7} />
          </mesh>
          {/* Dual Barrels */}
          <mesh position={[0, 0.04, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.3, 8]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
        </group>
      );

    case 'MK-4': // Heavy Pistol
      return (
        <group>
          {/* Heavy Slide & Barrel */}
          <mesh position={[0, 0.02, 0.1]}>
            <boxGeometry args={[0.07, 0.1, 0.3]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.9} />
          </mesh>
          {/* Grip */}
          <mesh position={[0, -0.1, 0.02]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.06, 0.16, 0.09]} />
            <meshStandardMaterial color="#0f172a" roughness={0.9} />
          </mesh>
        </group>
      );

    case 'K-01': // Karambit
      return (
        <group>
          {/* Ring Handle */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.14, 12]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
          {/* Curved Blade */}
          <mesh position={[0, 0.08, 0.1]} rotation={[0.4, 0, 0]}>
            <boxGeometry args={[0.015, 0.06, 0.18]} />
            <meshStandardMaterial color="#f97316" emissive="#ea580c" emissiveIntensity={0.6} />
          </mesh>
        </group>
      );

    case 'AR-76': // Assault Rifle (Default)
    default:
      return (
        <group>
          {/* Receiver */}
          <mesh position={[0, 0, 0.15]}>
            <boxGeometry args={[0.09, 0.13, 0.62]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} metalness={0.8} />
          </mesh>
          {/* Barrel & Flash Hider */}
          <mesh position={[0, 0.02, 0.55]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.35, 8]} />
            <meshStandardMaterial color="#0f172a" metalness={0.9} />
          </mesh>
          {/* Magazine */}
          <mesh position={[0, -0.15, 0.18]} rotation={[0.2, 0, 0]}>
            <boxGeometry args={[0.06, 0.22, 0.1]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          {/* Holo Sight */}
          <mesh position={[0, 0.1, 0.12]}>
            <boxGeometry args={[0.06, 0.08, 0.14]} />
            <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.8} />
          </mesh>
        </group>
      );
  }
};
