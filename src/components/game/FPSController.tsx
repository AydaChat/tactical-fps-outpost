'use client';

import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { soundEngine } from '@/audio/SoundEngine';
import {
  resolveCollision,
  checkJumpPads,
  ARENA_SPAWN_POINTS,
  getRampHeightAt,
} from './collision';

interface FPSControllerProps {
  initialPosition?: [number, number, number];
  initialYaw?: number;
}

export const FPSController: React.FC<FPSControllerProps> = ({
  initialPosition = [0, 0.1, -30],
  initialYaw = 0,
}) => {
  const { camera, gl } = useThree();

  // Internal physics vectors
  const posRef = useRef<THREE.Vector3>(new THREE.Vector3(...initialPosition));
  const velRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const isGroundedRef = useRef<boolean>(true);
  const wasGroundedRef = useRef<boolean>(true);

  // Rotation angles (radians)
  const pitchRef = useRef<number>(0);
  const yawRef = useRef<number>(initialYaw);

  // Keyboard state
  const keysRef = useRef<{
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    jump: boolean;
    sprint: boolean;
    crouch: boolean;
  }>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    crouch: false,
  });

  // Jump pad cooldown tracking
  const lastJumpPadTimeRef = useRef<number>(0);
  const footstepTimerRef = useRef<number>(0);
  const bobTimerRef = useRef<number>(0);
  const currentEyeHeightRef = useRef<number>(1.7);
  const landImpactRef = useRef<number>(0);

  // Pointer lock state
  const isLockedRef = useRef<boolean>(false);

  // Global game store hooks
  const controlSettings = useGameStore((s) => s.controlSettings);
  const isAiming = useGameStore((s) => s.isAiming);
  const isDead = useGameStore((s) => s.isDead);
  const recoilOffset = useGameStore((s) => s.recoilOffset);
  const decayRecoil = useGameStore((s) => s.decayRecoil);
  const setSprinting = useGameStore((s) => s.setSprinting);
  const setCrouching = useGameStore((s) => s.setCrouching);
  const updateLocalPlayer = useGameStore((s) => s.updateLocalPlayer);
  const preferredTeam = useGameStore((s) => s.preferredTeam);

  // Setup initial camera & spawn point based on team
  useEffect(() => {
    // Find matching spawn point
    const teamSpawns = ARENA_SPAWN_POINTS.filter((sp) => sp.team === preferredTeam);
    const spawn =
      teamSpawns.length > 0
        ? teamSpawns[Math.floor(Math.random() * teamSpawns.length)]
        : ARENA_SPAWN_POINTS[0];

    posRef.current.set(spawn.position[0], spawn.position[1], spawn.position[2]);
    yawRef.current = spawn.yaw;
    pitchRef.current = 0;
    velRef.current.set(0, 0, 0);

    camera.position.set(spawn.position[0], spawn.position[1] + 1.7, spawn.position[2]);
    camera.rotation.set(0, spawn.yaw, 0, 'YXZ');
  }, [preferredTeam, camera]);

  // Handle pointer lock & mouse move
  useEffect(() => {
    const canvas = gl.domElement;

    const handlePointerLockChange = () => {
      isLockedRef.current = document.pointerLockElement === canvas;
    };

    const handleCanvasClick = () => {
      if (!isLockedRef.current && !isDead) {
        soundEngine.init();
        canvas.requestPointerLock();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isLockedRef.current || isDead) return;

      const sens = controlSettings.mouseSensitivity * 0.0018;
      const adsFactor = isAiming ? controlSettings.adsSensitivityMultiplier : 1.0;
      const invertYFactor = controlSettings.invertY ? -1 : 1;

      const movementX = e.movementX || 0;
      const movementY = e.movementY || 0;

      yawRef.current -= movementX * sens * adsFactor;
      pitchRef.current -= movementY * sens * adsFactor * invertYFactor;

      // Clamp vertical pitch (-89° to +89°)
      pitchRef.current = Math.max(-1.55, Math.min(1.55, pitchRef.current));
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    canvas.addEventListener('click', handleCanvasClick);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      canvas.removeEventListener('click', handleCanvasClick);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gl, controlSettings, isAiming, isDead]);

  // Handle Keyboard Inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDead) return;

      switch (e.code) {
        case 'KeyW':
          keysRef.current.forward = true;
          break;
        case 'KeyS':
          keysRef.current.backward = true;
          break;
        case 'KeyA':
          keysRef.current.left = true;
          break;
        case 'KeyD':
          keysRef.current.right = true;
          break;
        case 'Space':
          keysRef.current.jump = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keysRef.current.sprint = true;
          setSprinting(true);
          break;
        case 'KeyC':
        case 'ControlLeft':
          keysRef.current.crouch = true;
          setCrouching(true);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
          keysRef.current.forward = false;
          break;
        case 'KeyS':
          keysRef.current.backward = false;
          break;
        case 'KeyA':
          keysRef.current.left = false;
          break;
        case 'KeyD':
          keysRef.current.right = false;
          break;
        case 'Space':
          keysRef.current.jump = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keysRef.current.sprint = false;
          setSprinting(false);
          break;
        case 'KeyC':
        case 'ControlLeft':
          keysRef.current.crouch = false;
          setCrouching(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isDead, setSprinting, setCrouching]);

  // Main 60Hz Physics & Camera Frame Loop
  useFrame((_, delta) => {
    // Clamp delta to prevent physics explosion on lag spikes
    const dt = Math.min(delta, 0.05);

    // If dead, apply dramatic death tilt and exit
    if (isDead) {
      pitchRef.current = THREE.MathUtils.lerp(pitchRef.current, 0.4, dt * 4);
      camera.rotation.set(pitchRef.current, yawRef.current, 0.35, 'YXZ');
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, posRef.current.y + 0.3, dt * 5);
      return;
    }

    const pos = posRef.current;
    const vel = velRef.current;
    const keys = keysRef.current;

    const isCrouching = keys.crouch;
    const isSprinting = keys.sprint && !isCrouching && keys.forward && !isAiming;

    // 1. Determine target movement speed
    let targetSpeed = 7.2; // Walk
    if (isCrouching) targetSpeed = 3.6; // Crouch
    else if (isSprinting) targetSpeed = 11.4; // Sprint
    else if (isAiming) targetSpeed = 4.2; // ADS Walk

    // 2. Compute input direction in world coordinates
    let inputX = 0;
    let inputZ = 0;
    if (keys.forward) inputZ -= 1;
    if (keys.backward) inputZ += 1;
    if (keys.left) inputX -= 1;
    if (keys.right) inputX += 1;

    const inputLen = Math.hypot(inputX, inputZ);
    const hasInput = inputLen > 0.001;

    let moveDir = new THREE.Vector3(0, 0, 0);
    if (hasInput) {
      inputX /= inputLen;
      inputZ /= inputLen;

      // Transform by camera yaw
      const sinY = Math.sin(yawRef.current);
      const cosY = Math.cos(yawRef.current);

      moveDir.x = inputX * cosY - inputZ * sinY;
      moveDir.z = inputX * sinY + inputZ * cosY;
    }

    // 3. Ground & Air Physics
    const isGrounded = isGroundedRef.current;

    if (isGrounded) {
      // Ground acceleration & friction
      const groundAccel = 68.0;
      const friction = 11.5;

      if (hasInput) {
        // Accelerate horizontally
        const targetVelX = moveDir.x * targetSpeed;
        const targetVelZ = moveDir.z * targetSpeed;

        vel.x = THREE.MathUtils.lerp(vel.x, targetVelX, groundAccel * dt * 0.15);
        vel.z = THREE.MathUtils.lerp(vel.z, targetVelZ, groundAccel * dt * 0.15);
      } else {
        // Apply ground deceleration
        vel.x = THREE.MathUtils.lerp(vel.x, 0, friction * dt);
        vel.z = THREE.MathUtils.lerp(vel.z, 0, friction * dt);
      }

      // Jump Impulse
      if (keys.jump) {
        vel.y = 8.8;
        isGroundedRef.current = false;
      } else {
        vel.y = 0;
      }
    } else {
      // Air physics: Gravity & Air strafe control
      const gravity = -26.5;
      const airAccel = 18.0;

      vel.y += gravity * dt;

      if (hasInput) {
        vel.x += moveDir.x * airAccel * dt;
        vel.z += moveDir.z * airAccel * dt;

        // Clamp horizontal air velocity
        const horizSpeed = Math.hypot(vel.x, vel.z);
        if (horizSpeed > targetSpeed * 1.2) {
          const ratio = (targetSpeed * 1.2) / horizSpeed;
          vel.x *= ratio;
          vel.z *= ratio;
        }
      }
    }

    // 4. Check Jump Pad Intersections
    const nowMs = performance.now();
    if (nowMs - lastJumpPadTimeRef.current > 600) {
      const pad = checkJumpPads([pos.x, pos.y, pos.z], 0.5);
      if (pad) {
        vel.x = pad.velocity[0];
        vel.y = pad.velocity[1];
        vel.z = pad.velocity[2];
        isGroundedRef.current = false;
        lastJumpPadTimeRef.current = nowMs;
        soundEngine.playJumpPadWhoosh();
      }
    }

    // 5. Predict Next Position & Perform Collision Resolution
    const targetY = pos.y + vel.y * dt;
    const targetX = pos.x + vel.x * dt;
    const targetZ = pos.z + vel.z * dt;

    const playerHeight = isCrouching ? 1.1 : 1.8;
    const collisionResult = resolveCollision(
      [pos.x, pos.y, pos.z],
      [targetX, targetY, targetZ],
      0.45,
      playerHeight
    );

    // Update position
    pos.set(
      collisionResult.position[0],
      collisionResult.position[1],
      collisionResult.position[2]
    );

    // If hit ceiling, cancel upward velocity
    if (collisionResult.hitCeiling && vel.y > 0) {
      vel.y = 0;
    }

    // Land Impact bounce detection
    if (!wasGroundedRef.current && collisionResult.isGrounded) {
      landImpactRef.current = Math.min(0.22, Math.abs(vel.y) * 0.02);
      soundEngine.playFootstep('concrete', false);
    }
    wasGroundedRef.current = isGroundedRef.current;
    isGroundedRef.current = collisionResult.isGrounded;

    // Decay land impact dip
    landImpactRef.current = THREE.MathUtils.lerp(landImpactRef.current, 0, dt * 10);

    // 6. Camera Eye Height & Head Bobbing
    const targetEyeHeight = isCrouching ? 1.05 : 1.7;
    currentEyeHeightRef.current = THREE.MathUtils.lerp(
      currentEyeHeightRef.current,
      targetEyeHeight,
      dt * 12
    );

    const horizontalSpeed = Math.hypot(vel.x, vel.z);
    let bobX = 0;
    let bobY = 0;

    if (isGrounded && horizontalSpeed > 0.5) {
      const bobFreq = isSprinting ? 14.5 : isCrouching ? 8.0 : 10.5;
      bobTimerRef.current += dt * bobFreq;

      const bobAmp = isSprinting ? 0.055 : isCrouching ? 0.02 : 0.038;
      bobY = Math.sin(bobTimerRef.current * 2) * bobAmp;
      bobX = Math.cos(bobTimerRef.current) * (bobAmp * 0.65);

      // Footstep Sound triggers
      footstepTimerRef.current += dt * (horizontalSpeed / 7.2);
      if (footstepTimerRef.current > (isSprinting ? 0.32 : 0.48)) {
        footstepTimerRef.current = 0;
        const rampSurface = getRampHeightAt(pos.x, pos.z);
        const surfaceType = rampSurface !== null || pos.y > 3.5 ? 'metal' : 'concrete';
        soundEngine.playFootstep(surfaceType, isSprinting);
      }
    } else {
      bobTimerRef.current = 0;
      footstepTimerRef.current = 0;
    }

    // 7. Recoil Offset decay
    decayRecoil(dt * 8);

    // 8. Apply Final Camera Transform
    const finalPitch = pitchRef.current + (recoilOffset?.pitch || 0) * 0.02;
    const finalYaw = yawRef.current + (recoilOffset?.yaw || 0) * 0.02;

    camera.rotation.set(finalPitch, finalYaw, 0, 'YXZ');
    camera.position.set(
      pos.x + bobX,
      pos.y + currentEyeHeightRef.current + bobY - landImpactRef.current,
      pos.z
    );

    // 9. Sync state to Zustand Store for UI / Netcode
    updateLocalPlayer({
      position: { x: pos.x, y: pos.y, z: pos.z },
      rotation: { x: pitchRef.current, y: yawRef.current, z: 0 },
      velocity: { x: vel.x, y: vel.y, z: vel.z },
      isCrouching,
      isSprinting,
    });
  });

  return null;
};
