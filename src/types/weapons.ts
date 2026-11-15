export type ShortWeaponId = 'AR' | 'SR' | 'SMG' | 'SG' | 'PISTOL' | 'KNIFE';
export type FullWeaponId = 'AR-76' | 'SR-99' | 'SMG-9' | 'SG-12' | 'MK-4' | 'K-01';
export type WeaponId = ShortWeaponId | FullWeaponId;

export function normalizeWeaponId(id: string): ShortWeaponId {
  if (id === 'AR-76' || id === 'AR') return 'AR';
  if (id === 'SR-99' || id === 'SR') return 'SR';
  if (id === 'SMG-9' || id === 'SMG') return 'SMG';
  if (id === 'SG-12' || id === 'SG') return 'SG';
  if (id === 'MK-4' || id === 'PISTOL') return 'PISTOL';
  if (id === 'K-01' || id === 'KNIFE') return 'KNIFE';
  return 'AR';
}

export function toFullWeaponId(id: string): FullWeaponId {
  const norm = normalizeWeaponId(id);
  switch (norm) {
    case 'AR': return 'AR-76';
    case 'SR': return 'SR-99';
    case 'SMG': return 'SMG-9';
    case 'SG': return 'SG-12';
    case 'PISTOL': return 'MK-4';
    case 'KNIFE': return 'K-01';
  }
}

export type WeaponCategory = 'primary' | 'secondary' | 'melee';

export interface WeaponRecoilConfig {
  pitch: number;        // Vertical climb per shot (radians or degrees)
  yaw: number;          // Horizontal drift per shot (random +/-)
  kickback: number;     // Physical viewmodel backward translation (meters)
  recoverySpeed: number;// Speed at which weapon settles back to zero
  shakeIntensity: number;// Camera shake punch
}

export interface WeaponSpreadConfig {
  base: number;         // Standing hipfire spread (radians)
  moving: number;       // Running spread penalty
  airborne: number;     // Jumping spread penalty
  ads: number;          // ADS spread accuracy multiplier (e.g. 0.05 for sniper/AR)
}

export interface WeaponADSConfig {
  position: [number, number, number]; // Viewmodel translation when ADS
  rotation: [number, number, number]; // Viewmodel rotation when ADS
  fovMultiplier: number;              // Target FOV multiplier (e.g. 0.7 for AR, 0.25 for Sniper)
  speed: number;                      // ADS transition speed (lerp alpha/rate)
}

export interface WeaponAnimationConfig {
  hipPosition: [number, number, number];
  hipRotation: [number, number, number];
  sprintPosition: [number, number, number];
  sprintRotation: [number, number, number];
  reloadDip: [number, number, number];
  reloadRot: [number, number, number];
}

export interface WeaponConfig {
  id: WeaponId;
  name: string;
  category: WeaponCategory;
  description: string;
  damage: number;             // Base body damage
  headshotMultiplier: number; // Headshot damage multiplier (standard 2.5x)
  fireRate: number;           // Fire rate in rounds per minute (RPM)
  automatic: boolean;         // Hold down trigger to continuously fire
  pellets: number;            // Number of raycast pellets per shot (e.g. 8 for shotgun, 1 for rifles)
  clipSize: number;           // Magazine capacity
  maxReserveAmmo: number;     // Maximum reserve ammo carried
  reloadDuration: number;     // Reload animation duration in seconds
  range: number;              // Maximum effective range in meters
  bulletSpeed: number;        // Visual tracer speed in m/s
  tracerColor: string;        // Hex color for bullet tracer
  muzzleFlashColor: string;   // Hex color for muzzle flash
  recoil: WeaponRecoilConfig;
  spread: WeaponSpreadConfig;
  ads: WeaponADSConfig;
  anim: WeaponAnimationConfig;
}

export interface BulletTracerData {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  speed: number;
  createdAt: number;
  lifetime: number;
}

export interface ShellCasingData {
  id: string;
  position: [number, number, number];
  velocity: [number, number, number];
  rotation: [number, number, number];
  angularVelocity: [number, number, number];
  createdAt: number;
  lifetime: number;
}

export interface ImpactSparkData {
  id: string;
  position: [number, number, number];
  normal: [number, number, number];
  color: string;
  count: number;
  isHeadshot?: boolean;
  createdAt: number;
}
