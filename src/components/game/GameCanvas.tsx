'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { Arena } from './Arena';
import { FPSController } from './FPSController';
import { ThirdPersonPlayer } from './ThirdPersonPlayer';
import { ViewModel } from './ViewModel';
import { TracerManager } from './TracerManager';

// ----------------------------------------------------------------------------
// ATMOSPHERIC SKY DOME (Sci-Fi Deep Sky & Starfield Gradient)
// ----------------------------------------------------------------------------
const SkyDome: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);

  const skyShader = useMemo(() => {
    return {
      uniforms: {
        topColor: { value: new THREE.Color('#030712') }, // Deep obsidian
        bottomColor: { value: new THREE.Color('#0a1628') }, // Industrial sci-fi horizon
        offset: { value: 20 },
        exponent: { value: 0.7 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          float factor = max(pow(max(h, 0.0), exponent), 0.0);
          gl_FragColor = vec4(mix(bottomColor, topColor, factor), 1.0);
        }
      `,
    };
  }, []);

  return (
    <group>
      {/* Sky Sphere */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[350, 32, 24]} />
        <shaderMaterial
          args={[skyShader]}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>

      {/* Atmospheric Horizon Ring Glow */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[180, 340, 32]} />
        <meshBasicMaterial
          color="#0369a1"
          side={THREE.DoubleSide}
          transparent
          opacity={0.12}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

// ----------------------------------------------------------------------------
// REMOTE MULTIPLAYER PLAYERS LAYER
// ----------------------------------------------------------------------------
const RemotePlayersLayer: React.FC = () => {
  const players = useGameStore((s) => s.players);
  const localPlayerId = useGameStore((s) => s.playerId);

  const remoteList = useMemo(() => {
    return Object.values(players).filter((p) => p.id !== localPlayerId);
  }, [players, localPlayerId]);

  return (
    <group name="REMOTE_PLAYERS">
      {remoteList.map((player) => (
        <ThirdPersonPlayer key={player.id} player={player} />
      ))}
    </group>
  );
};

// ----------------------------------------------------------------------------
// FPS MOUSE LOCK PROMPT OVERLAY
// ----------------------------------------------------------------------------
const PointerLockOverlay: React.FC<{ isLocked: boolean }> = ({ isLocked }) => {
  if (isLocked) return null;

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/45 backdrop-blur-[2px] pointer-events-none select-none transition-opacity duration-300">
      <div className="relative px-8 py-5 border border-cyan-500/40 bg-[#090d16]/90 rounded-sm shadow-[0_0_35px_rgba(6,182,212,0.25)] text-center max-w-md">
        {/* Corner Decals */}
        <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-cyan-400" />

        <div className="text-cyan-400 font-mono text-xs tracking-[0.25em] uppercase mb-1 flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          OUTPOST-09 ACTIVE SECTOR
        </div>

        <h2 className="text-white font-mono text-lg font-black tracking-wider uppercase mb-3">
          CLICK ANYWHERE TO ENGAGE
        </h2>

        <div className="text-slate-400 font-mono text-xs space-y-1">
          <p>
            <span className="text-cyan-300 font-bold">WASD</span> MOVE &bull;{' '}
            <span className="text-cyan-300 font-bold">SHIFT</span> SPRINT &bull;{' '}
            <span className="text-cyan-300 font-bold">C / CTRL</span> CROUCH
          </p>
          <p>
            <span className="text-cyan-300 font-bold">SPACE</span> JUMP &bull;{' '}
            <span className="text-cyan-300 font-bold">R</span> RELOAD &bull;{' '}
            <span className="text-cyan-300 font-bold">R-CLICK</span> ADS
          </p>
          <p className="text-[10px] text-slate-500 pt-1">PRESS ESCAPE TO OPEN SETTINGS</p>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// MAIN GAME CANVAS COMPONENT
// ----------------------------------------------------------------------------
export const GameCanvas: React.FC = () => {
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const fov = useGameStore((s) => s.graphicsSettings?.fov ?? 85);

  useEffect(() => {
    const handleLockChange = () => {
      setIsLocked(document.pointerLockElement !== null);
    };

    document.addEventListener('pointerlockchange', handleLockChange);
    return () => {
      document.removeEventListener('pointerlockchange', handleLockChange);
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#070a12]">
      {/* Click-to-lock instruction banner */}
      <PointerLockOverlay isLocked={isLocked} />

      <Canvas
        shadows="soft"
        camera={{
          fov,
          near: 0.08,
          far: 500,
          position: [0, 1.7, -30],
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        dpr={[1, typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1]}
      >
        {/* Atmospheric Fog */}
        <fogExp2 attach="fog" args={['#070a14', 0.015]} />

        {/* Sci-Fi Sky Dome */}
        <SkyDome />

        {/* Ambient & Hemisphere Environmental Fill */}
        <ambientLight intensity={0.4} color="#64748b" />
        <hemisphereLight
          args={['#38bdf8', '#070a14', 0.45]}
          position={[0, 50, 0]}
        />

        {/* Key Directional Sun/Moonlight with Crisp Shadows */}
        <directionalLight
          position={[32, 52, 28]}
          intensity={1.75}
          color="#f8fafc"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-48}
          shadow-camera-right={48}
          shadow-camera-top={48}
          shadow-camera-bottom={-48}
          shadow-camera-near={1}
          shadow-camera-far={130}
          shadow-bias={-0.0003}
          shadow-normalBias={0.03}
        />

        {/* Secondary Cyberpunk Cyan Rim/Fill Light */}
        <directionalLight
          position={[-30, 36, -26]}
          intensity={0.55}
          color="#06b6d4"
        />

        {/* 3D OUTPOST-09 Arena (Brutalist Architecture, Platforms, Towers, Jump Pads) */}
        <Arena />

        {/* 1st Person Character Controller (WASD, Sprint, Crouch, Jump, Air control, Collisions) */}
        <FPSController />

        {/* 1st Person Weapon Viewmodel (ADS, Bobbing, Sway, Recoil Kick, Firing) */}
        <ViewModel />

        {/* Bullet Tracers & Spark Effects */}
        <TracerManager />

        {/* Remote 3rd-Person Soldiers */}
        <RemotePlayersLayer />
      </Canvas>
    </div>
  );
};

export default GameCanvas;
