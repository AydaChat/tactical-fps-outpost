'use client';

import React, { useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useGameStore } from '@/store/gameStore';
import { socketClient } from '@/network/socketClient';
import { WEAPON_CONFIGS, WeaponId } from '@/types/game';
import { Lobby } from '@/components/ui/Lobby';
import { HUD } from '@/components/ui/HUD';
import { Scoreboard } from '@/components/ui/Scoreboard';
import { SettingsModal } from '@/components/ui/SettingsModal';
import { SniperScope } from '@/components/ui/SniperScope';

// Dynamically import 3D GameCanvas without SSR
const GameCanvas = dynamic(
  () =>
    import('@/components/game/GameCanvas')
      .then((mod) => mod.GameCanvas || mod.default)
      .catch(() => {
        // Fallback placeholder if GameCanvas is still compiling or loading
        const FallbackCanvas: React.FC = () => (
          <div className="absolute inset-0 bg-[#07090e] flex items-center justify-center font-mono text-cyan-400">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-sm uppercase tracking-widest font-bold">
                INITIALIZING OUTPOST-09 ARENA...
              </div>
              <div className="text-xs text-gray-500">Compiling 3D Shaders & Environment Geometries</div>
            </div>
          </div>
        );
        return FallbackCanvas;
      }),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-[#07090e] flex items-center justify-center font-mono text-cyan-400">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="text-sm uppercase tracking-widest font-bold">
            LOADING VORTEX ENGINE...
          </div>
        </div>
      </div>
    ),
  }
);

export default function GamePage() {
  const {
    isInGame,
    isDead,
    loadout,
    currentWeaponId,
    switchWeapon,
    startReload,
    finishReload,
    isReloading,
    isScoreboardOpen,
    setScoreboardOpen,
    isSettingsOpen,
    setSettingsOpen,
    setAiming,
  } = useGameStore();

  // Connect socket client on initial mount
  useEffect(() => {
    socketClient.connect();
    return () => {
      // Keep socket connected or clean up on unmount
    };
  }, []);

  // Handle reload timer: finish reload after weapon's reloadTime
  useEffect(() => {
    if (!isReloading) return;

    const config = WEAPON_CONFIGS[currentWeaponId];
    const reloadDurationMs = (config?.reloadTime || 2.2) * 1000;

    const timer = setTimeout(() => {
      finishReload();
    }, reloadDurationMs);

    return () => clearTimeout(timer);
  }, [isReloading, currentWeaponId, finishReload]);

  // Global Keyboard Controls (TAB, ESC, 1/2/3 weapon slots, R reload)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isInGame) return;

      // Scoreboard (TAB)
      if (e.code === 'Tab') {
        e.preventDefault();
        setScoreboardOpen(true);
        return;
      }

      // Settings Modal (ESC)
      if (e.code === 'Escape') {
        e.preventDefault();
        setSettingsOpen(!isSettingsOpen);
        if (!isSettingsOpen && document.exitPointerLock) {
          document.exitPointerLock();
        }
        return;
      }

      // Ignore gameplay inputs if in settings or dead
      if (isSettingsOpen || isDead) return;

      // Weapon Switching: 1 (Primary), 2 (Secondary), 3 (Melee)
      if (e.code === 'Digit1') {
        switchWeapon(loadout.primary);
        socketClient.sendSwitchWeapon(loadout.primary);
      } else if (e.code === 'Digit2') {
        switchWeapon(loadout.secondary);
        socketClient.sendSwitchWeapon(loadout.secondary);
      } else if (e.code === 'Digit3') {
        switchWeapon(loadout.melee);
        socketClient.sendSwitchWeapon(loadout.melee);
      }

      // Reload: R
      if (e.code === 'KeyR') {
        startReload();
        socketClient.sendReload();
      }
    },
    [
      isInGame,
      isSettingsOpen,
      isDead,
      loadout,
      switchWeapon,
      startReload,
      setScoreboardOpen,
      setSettingsOpen,
    ]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (!isInGame) return;
      if (e.code === 'Tab') {
        e.preventDefault();
        setScoreboardOpen(false);
      }
    },
    [isInGame, setScoreboardOpen]
  );

  // Mouse ADS (Right-click aim down sights)
  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!isInGame || isSettingsOpen || isDead) return;
      if (e.button === 2) {
        // Right click
        setAiming(true);
      }
    },
    [isInGame, isSettingsOpen, isDead, setAiming]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!isInGame) return;
      if (e.button === 2) {
        setAiming(false);
      }
    },
    [isInGame, setAiming]
  );

  const handleContextMenu = useCallback((e: MouseEvent) => {
    // Disable right-click browser menu in game
    e.preventDefault();
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleKeyDown, handleKeyUp, handleMouseDown, handleMouseUp, handleContextMenu]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#07090e] select-none">
      {/* LOBBY INTERFACE */}
      {!isInGame ? (
        <Lobby />
      ) : (
        /* IN-GAME 3D WORLD & HUD */
        <div className="relative w-full h-full">
          {/* 3D WebGL Canvas */}
          <GameCanvas />

          {/* Tactical HUD Overlay */}
          <HUD />

          {/* Sniper Scope 8x Overlay (when ADS with SR-99) */}
          <SniperScope />

          {/* Scoreboard Modal (Hold TAB) */}
          <Scoreboard />

          {/* Settings / Pause Modal (Press ESC) */}
          <SettingsModal />
        </div>
      )}
    </main>
  );
}
