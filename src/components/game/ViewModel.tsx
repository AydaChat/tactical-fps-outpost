import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/gameStore';
import { getWeaponConfig } from '../weapons/weaponConfig';
import { WeaponModel } from '../weapons/WeaponModel';
import { fxManager } from './TracerManager';
import { soundEngine } from '../../audio/SoundEngine';
import { normalizeWeaponId } from '../../types/weapons';

export interface ViewModelProps {
  overrideWeaponId?: string;
  overrideAiming?: boolean;
  overrideSprinting?: boolean;
  overrideMoving?: boolean;
  overrideReloading?: boolean;
  onFireRaycast?: (muzzleWorldPos: THREE.Vector3, targetDirection: THREE.Vector3) => void;
}

export const ViewModel: React.FC<ViewModelProps> = ({
  overrideWeaponId,
  overrideAiming,
  overrideSprinting,
  overrideMoving,
  overrideReloading,
  onFireRaycast,
}) => {
  const { camera } = useThree();

  // Root viewmodel rig attached to camera
  const rigGroupRef = useRef<THREE.Group>(null);
  const weaponHolderRef = useRef<THREE.Group>(null);
  const muzzleAnchorRef = useRef<THREE.Group>(null);
  const ejectionAnchorRef = useRef<THREE.Group>(null);

  // Store bindings
  const storeWeaponId = useGameStore((s) => s.currentWeaponId);
  const storeAiming = useGameStore((s) => s.isAiming);
  const storeSprinting = useGameStore((s) => s.isSprinting);
  const storeReloading = useGameStore((s) => s.isReloading);
  const storeFiring = useGameStore((s) => s.isFiring);
  const storeVelocity = useGameStore((s) => s.velocity);
  const storeAmmo = useGameStore((s) => s.ammo);
  const consumeAmmo = useGameStore((s) => s.consumeAmmo);
  const startReload = useGameStore((s) => s.startReload);
  const finishReload = useGameStore((s) => s.finishReload);
  const applyRecoil = useGameStore((s) => s.applyRecoil);
  const baseFov = useGameStore((s) => s.graphicsSettings?.fov ?? 85);
  const audioSettings = useGameStore((s) => s.audioSettings);

  // Sync audio settings with SoundEngine
  useEffect(() => {
    if (audioSettings) {
      soundEngine.setMasterVolume((audioSettings.masterVolume ?? 80) / 100);
      soundEngine.setSfxVolume((audioSettings.sfxVolume ?? 90) / 100);
    }
  }, [audioSettings]);

  const activeWeaponId = overrideWeaponId || storeWeaponId || 'AR-76';
  const isAiming = overrideAiming !== undefined ? overrideAiming : storeAiming;
  const isSprinting = overrideSprinting !== undefined ? overrideSprinting : storeSprinting;
  const isReloading = overrideReloading !== undefined ? overrideReloading : storeReloading;

  const weaponConfig = useMemo(() => getWeaponConfig(activeWeaponId), [activeWeaponId]);

  // Spring-damper and interpolation states
  const currentPos = useRef(new THREE.Vector3(0.22, -0.22, -0.42));
  const currentRot = useRef(new THREE.Euler(0.02, -0.05, 0.02));

  // Mouse sway tracking
  const mouseDelta = useRef({ x: 0, y: 0 });
  const swayOffset = useRef(new THREE.Vector3());
  const swayRotOffset = useRef(new THREE.Euler());

  // Movement bobbing cycle
  const bobTimer = useRef(0);
  const bobOffset = useRef(new THREE.Vector3());
  const bobRotOffset = useRef(new THREE.Euler());

  // Recoil kickback physics
  const recoilOffset = useRef(new THREE.Vector3());
  const recoilRotOffset = useRef(new THREE.Euler());
  const recoilVelocity = useRef(new THREE.Vector3());
  const recoilRotVelocity = useRef(new THREE.Euler());
  const [recoilProgress, setRecoilProgress] = useState(0);

  // Reload sequence animation (0 to 1)
  const reloadTimer = useRef(0);
  const [reloadProgress, setReloadProgress] = useState(0);
  const reloadAudioTriggered = useRef({ mag_out: false, mag_in: false, bolt: false });

  // Firing timing
  const lastShotTime = useRef(0);
  const [muzzleFlashActive, setMuzzleFlashActive] = useState(false);
  const muzzleFlashTimer = useRef(0);
  const flashRotation = useRef(0);

  // Mouse move listener for weapon sway inertia
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Clamp mouse delta to avoid extreme jerks
      const dx = THREE.MathUtils.clamp(e.movementX, -50, 50);
      const dy = THREE.MathUtils.clamp(e.movementY, -50, 50);
      mouseDelta.current.x += dx * 0.0012;
      mouseDelta.current.y += dy * 0.0012;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Keyboard shortcut listener for reload (R key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyR' && !isReloading && weaponConfig.category !== 'melee') {
        startReload();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isReloading, weaponConfig, startReload]);

  // Handle firing execution
  const executeShot = () => {
    const now = performance.now();
    const intervalMs = 60000 / weaponConfig.fireRate;
    if (now - lastShotTime.current < intervalMs) return;
    if (isReloading) return;

    if (weaponConfig.category !== 'melee') {
      const hasAmmo = consumeAmmo();
      if (!hasAmmo) {
        soundEngine.playEmptyClip();
        lastShotTime.current = now;
        return;
      }
    }

    lastShotTime.current = now;

    // 1. Play procedural gunshot sound
    soundEngine.playShot(activeWeaponId);

    // 2. Trigger Muzzle Flash (1-2 frames)
    if (weaponConfig.category !== 'melee') {
      setMuzzleFlashActive(true);
      muzzleFlashTimer.current = 0.045; // ~45ms
      flashRotation.current = Math.random() * Math.PI * 2;
    }

    // 3. Apply Recoil impulse
    const kickback = isAiming ? weaponConfig.recoil.kickback * 0.5 : weaponConfig.recoil.kickback;
    const pitch = isAiming ? weaponConfig.recoil.pitch * 0.6 : weaponConfig.recoil.pitch;
    const yaw = isAiming ? weaponConfig.recoil.yaw * 0.5 : weaponConfig.recoil.yaw;

    // Linear kick backward (+Z in viewmodel local space) & up (+Y)
    recoilVelocity.current.z += kickback * 1.8;
    recoilVelocity.current.y += kickback * 0.4;

    // Angular kick: pitch up (+X) & random yaw twist (+/- Y, roll Z)
    recoilRotVelocity.current.x += pitch * 2.2;
    recoilRotVelocity.current.y += (Math.random() - 0.5) * yaw * 1.8;
    recoilRotVelocity.current.z += (Math.random() - 0.5) * yaw * 0.8;

    // Store camera recoil offset
    applyRecoil(pitch * 0.8, yaw * 0.8);

    // 4. Spawn Bullet Tracers & Shell Casings via FXManager
    if (muzzleAnchorRef.current) {
      const muzzlePos = new THREE.Vector3();
      muzzleAnchorRef.current.getWorldPosition(muzzlePos);

      // Camera center raycast direction
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);

      // Pellets calculation
      const pelletCount = weaponConfig.pellets || 1;
      const spreadVal = isAiming ? weaponConfig.spread.ads : weaponConfig.spread.base;

      for (let p = 0; p < pelletCount; p++) {
        const spreadVec = new THREE.Vector3(
          (Math.random() - 0.5) * spreadVal,
          (Math.random() - 0.5) * spreadVal,
          0
        ).applyQuaternion(camera.quaternion);

        const bulletDir = forward.clone().add(spreadVec).normalize();
        const hitTarget = muzzlePos.clone().addScaledVector(bulletDir, weaponConfig.range);

        if (weaponConfig.category !== 'melee') {
          fxManager.spawnTracer(
            muzzlePos,
            hitTarget,
            weaponConfig.tracerColor,
            weaponConfig.bulletSpeed
          );
        }

        if (onFireRaycast) {
          onFireRaycast(muzzlePos, bulletDir);
        }
      }
    }

    // Spawn brass shell casing
    if (ejectionAnchorRef.current && weaponConfig.category !== 'melee') {
      const ejectionPos = new THREE.Vector3();
      ejectionAnchorRef.current.getWorldPosition(ejectionPos);

      // Right-and-upward ejection normal vector in world space
      const ejectDir = new THREE.Vector3(0.8, 0.4, 0.1).applyQuaternion(camera.quaternion);
      fxManager.spawnShell(ejectionPos, ejectDir);
    }
  };

  // Continuous automatic fire handling
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);

    // Check continuous firing
    if (storeFiring && !isReloading) {
      if (weaponConfig.automatic) {
        executeShot();
      } else {
        // Semi-auto fired once on press
        const now = performance.now();
        const intervalMs = 60000 / weaponConfig.fireRate;
        if (now - lastShotTime.current >= intervalMs) {
          executeShot();
        }
      }
    }

    // Update Muzzle Flash Timer
    if (muzzleFlashActive) {
      muzzleFlashTimer.current -= dt;
      if (muzzleFlashTimer.current <= 0) {
        setMuzzleFlashActive(false);
      }
    }

    // 1. Calculate Target Base Transform (Hip vs ADS vs Sprint)
    let targetPos = new THREE.Vector3(...weaponConfig.anim.hipPosition);
    let targetRot = new THREE.Euler(...weaponConfig.anim.hipRotation);

    if (isReloading) {
      targetPos.add(new THREE.Vector3(...weaponConfig.anim.reloadDip));
      targetRot.x += weaponConfig.anim.reloadRot[0];
      targetRot.y += weaponConfig.anim.reloadRot[1];
      targetRot.z += weaponConfig.anim.reloadRot[2];
    } else if (isSprinting) {
      targetPos = new THREE.Vector3(...weaponConfig.anim.sprintPosition);
      targetRot = new THREE.Euler(...weaponConfig.anim.sprintRotation);
    } else if (isAiming) {
      targetPos = new THREE.Vector3(...weaponConfig.ads.position);
      targetRot = new THREE.Euler(...weaponConfig.ads.rotation);
    }

    // 2. Dynamic Camera FOV Zoom for ADS
    const targetFov = isAiming ? baseFov * weaponConfig.ads.fovMultiplier : baseFov;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, dt * weaponConfig.ads.speed);
      camera.updateProjectionMatrix();
    }

    // 3. Mouse Sway Spring-Damper Physics
    const swayFactor = isAiming ? 0.25 : 1.0;
    const targetSwayX = -mouseDelta.current.x * 0.12 * swayFactor;
    const targetSwayY = mouseDelta.current.y * 0.12 * swayFactor;
    const targetSwayRotZ = mouseDelta.current.x * 0.25 * swayFactor;
    const targetSwayRotX = -mouseDelta.current.y * 0.2 * swayFactor;

    // Decay mouse delta
    mouseDelta.current.x *= Math.pow(0.05, dt);
    mouseDelta.current.y *= Math.pow(0.05, dt);

    swayOffset.current.x = THREE.MathUtils.lerp(swayOffset.current.x, targetSwayX, dt * 10);
    swayOffset.current.y = THREE.MathUtils.lerp(swayOffset.current.y, targetSwayY, dt * 10);
    swayRotOffset.current.z = THREE.MathUtils.lerp(swayRotOffset.current.z, targetSwayRotZ, dt * 10);
    swayRotOffset.current.x = THREE.MathUtils.lerp(swayRotOffset.current.x, targetSwayRotX, dt * 10);

    // 4. Movement Bobbing (Walking / Sprinting Sine/Cosine cycles)
    const horizSpeed = Math.sqrt(
      (storeVelocity?.x ?? 0) ** 2 + (storeVelocity?.z ?? 0) ** 2
    );
    const isMoving = overrideMoving || horizSpeed > 0.4;

    if (isMoving && !isAiming) {
      const bobFreq = isSprinting ? 12 : 7;
      bobTimer.current += dt * bobFreq;

      const bobAmpY = isSprinting ? 0.024 : 0.012;
      const bobAmpX = isSprinting ? 0.016 : 0.008;

      bobOffset.current.y = Math.sin(bobTimer.current) * bobAmpY;
      bobOffset.current.x = Math.cos(bobTimer.current * 0.5) * bobAmpX;
      bobRotOffset.current.z = Math.cos(bobTimer.current * 0.5) * 0.025;
      bobRotOffset.current.y = Math.sin(bobTimer.current * 0.5) * 0.018;
    } else {
      // Idle gentle breathing
      bobTimer.current += dt * 1.5;
      bobOffset.current.y = Math.sin(bobTimer.current) * 0.002;
      bobOffset.current.x = Math.cos(bobTimer.current * 0.5) * 0.001;
      bobRotOffset.current.set(0, 0, 0);
    }

    // 5. Recoil Spring-Damper Physics
    const springStiffness = weaponConfig.recoil.recoverySpeed * 22;
    const damping = weaponConfig.recoil.recoverySpeed * 1.8;

    // Position spring
    const springForceZ = -springStiffness * recoilOffset.current.z - damping * recoilVelocity.current.z;
    const springForceY = -springStiffness * recoilOffset.current.y - damping * recoilVelocity.current.y;
    recoilVelocity.current.z += springForceZ * dt;
    recoilVelocity.current.y += springForceY * dt;
    recoilOffset.current.z += recoilVelocity.current.z * dt;
    recoilOffset.current.y += recoilVelocity.current.y * dt;

    // Rotation spring
    const rotSpringForceX = -springStiffness * recoilRotOffset.current.x - damping * recoilRotVelocity.current.x;
    const rotSpringForceY = -springStiffness * recoilRotOffset.current.y - damping * recoilRotVelocity.current.y;
    const rotSpringForceZ = -springStiffness * recoilRotOffset.current.z - damping * recoilRotVelocity.current.z;
    recoilRotVelocity.current.x += rotSpringForceX * dt;
    recoilRotVelocity.current.y += rotSpringForceY * dt;
    recoilRotVelocity.current.z += rotSpringForceZ * dt;
    recoilRotOffset.current.x += recoilRotVelocity.current.x * dt;
    recoilRotOffset.current.y += recoilRotVelocity.current.y * dt;
    recoilRotOffset.current.z += recoilRotVelocity.current.z * dt;

    // Calculate normalized recoil progress (0 to 1) for sub-part animations (e.g. slide kick)
    const normRecoil = THREE.MathUtils.clamp(recoilOffset.current.z / (weaponConfig.recoil.kickback * 1.5), 0, 1);
    setRecoilProgress(normRecoil);

    // 6. Multi-Stage Reload Animation & Audio Sequence
    if (isReloading) {
      reloadTimer.current += dt;
      const progress = THREE.MathUtils.clamp(reloadTimer.current / weaponConfig.reloadDuration, 0, 1);
      setReloadProgress(progress);

      // Trigger multi-stage reload audio clips at precise animation moments
      if (progress >= 0.22 && !reloadAudioTriggered.current.mag_out) {
        soundEngine.playReload(activeWeaponId, 'mag_out');
        reloadAudioTriggered.current.mag_out = true;
      }
      if (progress >= 0.62 && !reloadAudioTriggered.current.mag_in) {
        soundEngine.playReload(activeWeaponId, 'mag_in');
        reloadAudioTriggered.current.mag_in = true;
      }
      if (progress >= 0.82 && !reloadAudioTriggered.current.bolt) {
        soundEngine.playReload(activeWeaponId, 'bolt');
        reloadAudioTriggered.current.bolt = true;
      }

      if (progress >= 1.0) {
        reloadTimer.current = 0;
        setReloadProgress(0);
        reloadAudioTriggered.current = { mag_out: false, mag_in: false, bolt: false };
        finishReload();
      }
    } else {
      if (reloadTimer.current !== 0) {
        reloadTimer.current = 0;
        setReloadProgress(0);
        reloadAudioTriggered.current = { mag_out: false, mag_in: false, bolt: false };
      }
    }

    // 7. Combine Transforms and Apply to Weapon Rig
    const lerpSpeed = isAiming ? weaponConfig.ads.speed : 10.0;
    currentPos.current.lerp(targetPos, dt * lerpSpeed);

    currentRot.current.x = THREE.MathUtils.lerp(currentRot.current.x, targetRot.x, dt * lerpSpeed);
    currentRot.current.y = THREE.MathUtils.lerp(currentRot.current.y, targetRot.y, dt * lerpSpeed);
    currentRot.current.z = THREE.MathUtils.lerp(currentRot.current.z, targetRot.z, dt * lerpSpeed);

    if (weaponHolderRef.current) {
      weaponHolderRef.current.position.set(
        currentPos.current.x + swayOffset.current.x + bobOffset.current.x,
        currentPos.current.y + swayOffset.current.y + bobOffset.current.y + recoilOffset.current.y,
        currentPos.current.z + recoilOffset.current.z
      );

      weaponHolderRef.current.rotation.set(
        currentRot.current.x + swayRotOffset.current.x + recoilRotOffset.current.x,
        currentRot.current.y + bobRotOffset.current.y + recoilRotOffset.current.y,
        currentRot.current.z + swayRotOffset.current.z + bobRotOffset.current.z + recoilRotOffset.current.z
      );
    }
  });

  return (
    <group ref={rigGroupRef}>
      <group ref={weaponHolderRef}>
        {/* Procedural 3D Weapon Model */}
        <WeaponModel
          weaponId={activeWeaponId}
          isThirdPerson={false}
          reloadProgress={reloadProgress}
          recoilProgress={recoilProgress}
          muzzleRef={muzzleAnchorRef}
          ejectionRef={ejectionAnchorRef}
        />

        {/* Dynamic Muzzle Flash Point Light & Star Mesh */}
        {muzzleFlashActive && (
          <group position={muzzleAnchorRef.current?.position || [0, 0, -0.6]}>
            {/* Dynamic Muzzle Light */}
            <pointLight
              color={weaponConfig.muzzleFlashColor}
              intensity={4.5}
              distance={8.0}
              decay={2}
            />

            {/* Visual 3D Flash Star Geometry */}
            <group rotation={[0, 0, flashRotation.current]}>
              <mesh>
                <planeGeometry args={[0.18, 0.18]} />
                <meshBasicMaterial
                  color={weaponConfig.muzzleFlashColor}
                  transparent
                  opacity={0.9}
                  depthWrite={false}
                />
              </mesh>
              <mesh rotation={[0, 0, Math.PI / 4]}>
                <planeGeometry args={[0.12, 0.12]} />
                <meshBasicMaterial
                  color="#ffffff"
                  transparent
                  opacity={0.95}
                  depthWrite={false}
                />
              </mesh>
            </group>
          </group>
        )}
      </group>
    </group>
  );
};
