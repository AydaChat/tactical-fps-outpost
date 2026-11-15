'use client';

import React, { useEffect, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { WEAPON_CONFIGS } from '@/types/game';
import {
  Shield,
  Heart,
  Crosshair,
  Skull,
  AlertTriangle,
  RotateCw,
  Compass,
} from 'lucide-react';

export const HUD: React.FC = () => {
  const {
    health,
    maxHealth,
    armor,
    maxArmor,
    isDead,
    respawnTimeRemaining,
    currentWeaponId,
    ammo,
    isReloading,
    isAiming,
    isSprinting,
    isFiring,
    position,
    rotation,
    loadout,
    players,
    playerId,
    killfeed,
    hitmarkers,
    damageIndicators,
    recoilOffset,
    activeFps,
    ping,
    matchState,
    graphicsSettings,
    pruneKillfeed,
    pruneHitmarkers,
    pruneDamageIndicators,
  } = useGameStore();

  // Periodic pruning of transient UI feedback
  useEffect(() => {
    const interval = setInterval(() => {
      pruneKillfeed();
      pruneHitmarkers();
      pruneDamageIndicators();
    }, 100);
    return () => clearInterval(interval);
  }, [pruneKillfeed, pruneHitmarkers, pruneDamageIndicators]);

  const currentWeapon = WEAPON_CONFIGS[currentWeaponId];
  const isSniperADS = isAiming && currentWeaponId === 'SR-99';

  // Dynamic Crosshair Bloom calculation
  const crosshairSpread = useMemo(() => {
    let baseSpread = graphicsSettings.crosshairGap || 4;
    if (isAiming) {
      baseSpread = 2; // tightens when aiming
    } else {
      if (isSprinting) baseSpread += 14;
      if (isFiring) baseSpread += 8;
    }
    // Add recoil kick effect
    const recoilMagnitude = Math.sqrt(
      recoilOffset.pitch * recoilOffset.pitch + recoilOffset.yaw * recoilOffset.yaw
    );
    baseSpread += recoilMagnitude * 30;
    return Math.min(48, Math.max(1, baseSpread));
  }, [isAiming, isSprinting, isFiring, recoilOffset, graphicsSettings.crosshairGap]);

  // Health and Armor percentages
  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const armorPercent = Math.max(0, Math.min(100, (armor / maxArmor) * 100));
  const isLowHealth = health <= 30 && !isDead;

  // Ammo status
  const isAmmoLow =
    currentWeapon.category !== 'melee' &&
    ammo.current <= Math.ceil(currentWeapon.maxAmmo * 0.25);
  const isAmmoEmpty = currentWeapon.category !== 'melee' && ammo.current === 0;

  // Active Hitmarker
  const latestHitmarker = hitmarkers.length > 0 ? hitmarkers[hitmarkers.length - 1] : null;

  // Match Timer formatting
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Radar: Filter players around local position (within 60m radius)
  const radarRadius = 60; // in world units
  const radarSize = 130; // pixels diameter
  const radarHalf = radarSize / 2;

  const radarBlips = useMemo(() => {
    const blips: Array<{
      id: string;
      x: number;
      y: number;
      isTeammate: boolean;
      isFiring: boolean;
    }> = [];

    const localPlayer = players[playerId];
    const myTeam = localPlayer?.team || 'ALPHA';
    const playerYaw = rotation.y; // in radians

    for (const [id, p] of Object.entries(players)) {
      if (id === playerId || p.isDead) continue;

      const dx = p.position.x - position.x;
      const dz = p.position.z - position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance <= radarRadius) {
        // Rotate delta according to local player's facing yaw so radar is forward-oriented
        const angle = Math.atan2(dx, dz) - playerYaw;
        const normalizedDist = (distance / radarRadius) * (radarHalf - 10);

        const blipX = radarHalf + Math.sin(angle) * normalizedDist;
        const blipY = radarHalf - Math.cos(angle) * normalizedDist;

        const isTeammate = myTeam !== 'FFA' && p.team === myTeam;
        const isEnemyFiring = !isTeammate && p.isFiring;

        // In FFA or enemy team, show if firing or within close range
        if (isTeammate || isEnemyFiring || distance < 20) {
          blips.push({
            id,
            x: blipX,
            y: blipY,
            isTeammate,
            isFiring: isEnemyFiring,
          });
        }
      }
    }
    return blips;
  }, [players, playerId, position, rotation.y, radarHalf]);

  // Compass heading degree
  const compassDeg = Math.round(((rotation.y * 180) / Math.PI + 360) % 360);

  return (
    <div className="fixed inset-0 pointer-events-none select-none overflow-hidden z-20 font-mono">
      {/* 1. DAMAGE FLASH VIGNETTE & LOW HEALTH PULSE */}
      {damageIndicators.length > 0 && (
        <div className="absolute inset-0 bg-red-600/25 pointer-events-none animate-pulse transition-opacity duration-300" />
      )}
      {isLowHealth && (
        <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(239,68,68,0.35)] animate-pulse pointer-events-none" />
      )}

      {/* 2. DIRECTIONAL DAMAGE INDICATORS */}
      {damageIndicators.map((ind) => (
        <div
          key={ind.id}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div
            className="w-64 h-64 border-4 border-rose-500 rounded-full opacity-75 animate-ping"
            style={{
              clipPath: 'polygon(45% 0%, 55% 0%, 50% 15%)',
              transform: `rotate(${ind.angle}deg)`,
            }}
          />
        </div>
      ))}

      {/* 3. TOP BAR: MATCH STATUS & SCORES */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#0a0c10]/85 backdrop-blur-md px-6 py-2 rounded-lg border border-gray-800 shadow-xl">
        {/* ALPHA Team Score */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs text-gray-400 font-bold">ALPHA</span>
          <span className="text-lg font-black text-cyan-400">
            {matchState.scoreAlpha}
          </span>
        </div>

        {/* Match Timer */}
        <div className="px-3 py-1 bg-gray-900 border border-gray-800 rounded text-center">
          <div className="text-[10px] text-gray-500 tracking-widest uppercase">TIME</div>
          <div className="text-sm font-black text-white tracking-wider">
            {formatTime(matchState.timeRemaining)}
          </div>
        </div>

        {/* BRAVO Team Score */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-black text-rose-500">
            {matchState.scoreBravo}
          </span>
          <span className="text-xs text-gray-400 font-bold">BRAVO</span>
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
        </div>
      </div>

      {/* 4. TOP-LEFT: TACTICAL MINI-RADAR */}
      <div className="absolute top-4 left-4 bg-[#0a0c10]/90 backdrop-blur-md p-3 rounded-xl border border-gray-800 shadow-2xl">
        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1.5 px-0.5">
          <span className="flex items-center gap-1 text-cyan-400 font-bold">
            <Compass className="w-3 h-3" /> RADAR
          </span>
          <span>{compassDeg}°</span>
        </div>

        <div
          className="relative rounded-full border border-gray-700/80 bg-[#07090e] overflow-hidden"
          style={{ width: radarSize, height: radarSize }}
        >
          {/* Radar Sweep & Rings */}
          <div className="absolute inset-0 rounded-full border border-gray-800/60" />
          <div className="absolute inset-4 rounded-full border border-gray-800/40" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-800/40" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-800/40" />

          {/* Player Center Marker (Facing forward) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-cyan-400" />
          </div>

          {/* Detected Player Blips */}
          {radarBlips.map((blip) => (
            <div
              key={blip.id}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150 ${
                blip.isTeammate
                  ? 'w-2 h-2 bg-cyan-400 ring-2 ring-cyan-400/30'
                  : blip.isFiring
                  ? 'w-3 h-3 bg-rose-500 animate-ping ring-2 ring-rose-500'
                  : 'w-2 h-2 bg-rose-500'
              }`}
              style={{ left: blip.x, top: blip.y }}
            />
          ))}
        </div>
      </div>

      {/* 5. TOP-RIGHT: KILLFEED */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5 max-w-sm pointer-events-none">
        {killfeed.map((entry) => {
          const isAlphaKiller = entry.killerTeam === 'ALPHA';
          const isAlphaVictim = entry.victimTeam === 'ALPHA';

          return (
            <div
              key={entry.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0c10]/90 backdrop-blur-md border border-gray-800 rounded-md text-xs font-mono shadow-lg transition-all animate-in slide-in-from-right duration-200"
            >
              {/* Killer */}
              <span
                className={`font-black tracking-wide ${
                  isAlphaKiller ? 'text-cyan-400' : 'text-rose-400'
                }`}
              >
                {entry.killerName}
              </span>

              {/* Weapon & Headshot Icon */}
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-900 border border-gray-800 rounded text-[10px] text-gray-300">
                <span>{entry.weaponId}</span>
                {entry.isHeadshot && (
                  <span className="text-amber-400 font-bold ml-0.5">⚡HEAD</span>
                )}
              </div>

              {/* Victim */}
              <span
                className={`font-black tracking-wide ${
                  isAlphaVictim ? 'text-cyan-400' : 'text-rose-400'
                }`}
              >
                {entry.victimName}
              </span>
            </div>
          );
        })}
      </div>

      {/* 6. CENTER: DYNAMIC CROSSHAIR & HITMARKER */}
      {!isSniperADS && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
          {/* HITMARKER OVERLAY */}
          {latestHitmarker && (
            <div className="absolute pointer-events-none z-30 animate-out fade-out duration-200">
              {latestHitmarker.type === 'kill' ? (
                <div className="relative flex items-center justify-center text-rose-500 animate-bounce">
                  <Skull className="w-7 h-7 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                </div>
              ) : latestHitmarker.type === 'headshot' ? (
                <div className="w-8 h-8 relative flex items-center justify-center">
                  <div className="absolute w-6 h-0.5 bg-amber-400 rotate-45 shadow-[0_0_8px_#f59e0b]" />
                  <div className="absolute w-6 h-0.5 bg-amber-400 -rotate-45 shadow-[0_0_8px_#f59e0b]" />
                </div>
              ) : (
                <div className="w-6 h-6 relative flex items-center justify-center">
                  <div className="absolute w-4 h-0.5 bg-white rotate-45" />
                  <div className="absolute w-4 h-0.5 bg-white -rotate-45" />
                </div>
              )}
            </div>
          )}

          {/* DYNAMIC RETICLE TICKS */}
          <div className="relative w-20 h-20 flex items-center justify-center">
            {/* Center Dot */}
            {graphicsSettings.crosshairDot && (
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: graphicsSettings.crosshairColor || '#00f0ff' }}
              />
            )}

            {/* Top tick */}
            <div
              className="absolute w-0.5 rounded-sm transition-all duration-75"
              style={{
                height: `${graphicsSettings.crosshairSize || 6}px`,
                backgroundColor: graphicsSettings.crosshairColor || '#00f0ff',
                bottom: `calc(50% + ${crosshairSpread}px)`,
              }}
            />

            {/* Bottom tick */}
            <div
              className="absolute w-0.5 rounded-sm transition-all duration-75"
              style={{
                height: `${graphicsSettings.crosshairSize || 6}px`,
                backgroundColor: graphicsSettings.crosshairColor || '#00f0ff',
                top: `calc(50% + ${crosshairSpread}px)`,
              }}
            />

            {/* Left tick */}
            <div
              className="absolute h-0.5 rounded-sm transition-all duration-75"
              style={{
                width: `${graphicsSettings.crosshairSize || 6}px`,
                backgroundColor: graphicsSettings.crosshairColor || '#00f0ff',
                right: `calc(50% + ${crosshairSpread}px)`,
              }}
            />

            {/* Right tick */}
            <div
              className="absolute h-0.5 rounded-sm transition-all duration-75"
              style={{
                width: `${graphicsSettings.crosshairSize || 6}px`,
                backgroundColor: graphicsSettings.crosshairColor || '#00f0ff',
                left: `calc(50% + ${crosshairSpread}px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* 7. BOTTOM-LEFT: VITAL STATUS (HEALTH & ARMOR GAUGES) */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-2 bg-[#0a0c10]/90 backdrop-blur-md p-4 rounded-xl border border-gray-800 shadow-2xl min-w-[260px]">
        {/* Health Section */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-bold">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Heart className="w-3.5 h-3.5 fill-current" /> HEALTH
            </span>
            <span
              className={`text-base font-black tracking-wider ${
                isLowHealth ? 'text-rose-500 animate-pulse' : 'text-white'
              }`}
            >
              {health} <span className="text-[10px] text-gray-500">/ 100</span>
            </span>
          </div>
          <div className="h-2.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-200 ${
                isLowHealth
                  ? 'bg-gradient-to-r from-rose-600 to-rose-400'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400'
              }`}
              style={{ width: `${healthPercent}%` }}
            />
          </div>
        </div>

        {/* Armor Section */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1 font-bold">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Shield className="w-3.5 h-3.5 fill-current" /> SHIELD
            </span>
            <span className="text-sm font-black text-cyan-300">
              {armor} <span className="text-[10px] text-gray-500">/ 100</span>
            </span>
          </div>
          <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-200"
              style={{ width: `${armorPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 8. BOTTOM-RIGHT: AMMO COUNTER & WEAPON STATUS */}
      <div className="absolute bottom-6 right-6 flex items-end gap-3">
        {/* Reload Warning Indicator */}
        {isReloading ? (
          <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/50 text-amber-300 px-4 py-2 rounded-lg font-mono text-xs font-bold animate-pulse backdrop-blur-md">
            <RotateCw className="w-4 h-4 animate-spin" />
            RELOADING...
          </div>
        ) : isAmmoEmpty ? (
          <div className="flex items-center gap-1.5 bg-rose-600/30 border border-rose-500 text-rose-300 px-4 py-2 rounded-lg font-mono text-xs font-black animate-bounce backdrop-blur-md">
            <AlertTriangle className="w-4 h-4" />
            NO AMMO - PRESS [R]
          </div>
        ) : isAmmoLow ? (
          <div className="bg-amber-600/20 border border-amber-500/50 text-amber-300 px-3 py-1.5 rounded font-mono text-[11px] font-bold animate-pulse">
            LOW AMMO [R]
          </div>
        ) : null}

        {/* Tactical Weapon Card */}
        <div className="bg-[#0a0c10]/90 backdrop-blur-md p-4 rounded-xl border border-gray-800 shadow-2xl flex flex-col items-end min-w-[220px]">
          {/* Slot Badges: 1 (Primary) 2 (Secondary) 3 (Melee) */}
          <div className="flex items-center gap-1.5 mb-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                currentWeaponId === loadout.primary
                  ? 'bg-cyan-500 text-black'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              [1] {WEAPON_CONFIGS[loadout.primary].name.split(' ')[0]}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                currentWeaponId === loadout.secondary
                  ? 'bg-cyan-500 text-black'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              [2] MK-4
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                currentWeaponId === loadout.melee
                  ? 'bg-cyan-500 text-black'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              [3] K-01
            </span>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-gray-400 tracking-widest uppercase">
              {currentWeapon.category}
            </div>
            <div className="text-base font-black text-white tracking-wide">
              {currentWeapon.name}
            </div>
          </div>

          {/* Ammo Numbers */}
          <div className="mt-2 flex items-baseline gap-1">
            {currentWeapon.category === 'melee' ? (
              <span className="text-2xl font-black text-cyan-400 tracking-wider">
                TACTICAL
              </span>
            ) : (
              <>
                <span
                  className={`text-4xl font-black tracking-tight ${
                    isAmmoEmpty
                      ? 'text-rose-500'
                      : isAmmoLow
                      ? 'text-amber-400'
                      : 'text-white'
                  }`}
                >
                  {ammo.current}
                </span>
                <span className="text-base text-gray-500 font-bold">
                  / {ammo.reserve}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 9. BOTTOM CENTER: CONTROLS & FPS/PING HUD */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-gray-500 flex items-center gap-4">
        {graphicsSettings.showFps && (
          <span className="text-emerald-400 font-bold">{activeFps} FPS</span>
        )}
        <span>PING: {ping}ms</span>
        <span>[TAB] SCOREBOARD</span>
        <span>[ESC] SETTINGS</span>
      </div>

      {/* 10. ELIMINATION / DEATH OVERLAY */}
      {isDead && (
        <div className="absolute inset-0 bg-rose-950/70 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-auto z-40">
          <div className="p-8 rounded-2xl bg-[#0b0e14] border border-rose-500/50 shadow-2xl text-center max-w-md space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/20 border border-rose-500 flex items-center justify-center text-rose-500 animate-pulse">
              <Skull className="w-8 h-8" />
            </div>

            <div>
              <div className="text-xs font-mono text-rose-400 tracking-widest uppercase font-bold">
                OPERATOR DOWN
              </div>
              <h2 className="text-2xl font-black font-mono text-white tracking-wider mt-1">
                ELIMINATED
              </h2>
            </div>

            <div className="py-3 px-6 bg-gray-900/80 rounded-xl border border-gray-800">
              <div className="text-[10px] text-gray-400 uppercase tracking-widest font-mono">
                REDEPLOYING TO ARENA
              </div>
              <div className="text-3xl font-black text-rose-400 font-mono mt-1">
                {respawnTimeRemaining > 0
                  ? `${respawnTimeRemaining.toFixed(1)}s`
                  : 'READY'}
              </div>
            </div>

            <p className="text-xs text-gray-500 font-mono">
              Respawning at nearest secure tactical outpost...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
