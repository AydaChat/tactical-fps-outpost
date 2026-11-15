import { WeaponConfig, ShortWeaponId, normalizeWeaponId } from '../../types/weapons';

const BASE_WEAPONS: Record<ShortWeaponId, WeaponConfig> = {
  AR: {
    id: 'AR-76',
    name: 'AR-76 VANDAL',
    category: 'primary',
    description: 'Precision selective-fire assault rifle with integrated holographic optic and high lethality.',
    damage: 34,
    headshotMultiplier: 2.5, // 85 headshot
    fireRate: 600, // 600 RPM = 10 rounds/sec = 100ms
    automatic: true,
    pellets: 1,
    clipSize: 30,
    maxReserveAmmo: 90,
    reloadDuration: 2.2,
    range: 120,
    bulletSpeed: 300,
    tracerColor: '#ffaa33',
    muzzleFlashColor: '#ffaa22',
    recoil: {
      pitch: 0.038,
      yaw: 0.015,
      kickback: 0.055,
      recoverySpeed: 8.5,
      shakeIntensity: 0.04,
    },
    spread: {
      base: 0.015,
      moving: 0.045,
      airborne: 0.09,
      ads: 0.003,
    },
    ads: {
      position: [0, -0.165, -0.32],
      rotation: [0, 0, 0],
      fovMultiplier: 0.72,
      speed: 12.0,
    },
    anim: {
      hipPosition: [0.22, -0.22, -0.42],
      hipRotation: [0.02, -0.05, 0.02],
      sprintPosition: [0.18, -0.32, -0.35],
      sprintRotation: [-0.45, 0.55, -0.25],
      reloadDip: [0.08, -0.18, 0.06],
      reloadRot: [0.35, -0.3, 0.25],
    },
  },

  SR: {
    id: 'SR-99',
    name: 'SR-99 SPECTRE',
    category: 'primary',
    description: 'Anti-materiel heavy bolt-action sniper rifle with high-magnification ballistic optic.',
    damage: 95,
    headshotMultiplier: 2.5, // 237.5 lethal headshot
    fireRate: 45, // ~1.33s per bolt cycle
    automatic: false,
    pellets: 1,
    clipSize: 5,
    maxReserveAmmo: 20,
    reloadDuration: 3.5,
    range: 300,
    bulletSpeed: 500,
    tracerColor: '#44ddff',
    muzzleFlashColor: '#66eeff',
    recoil: {
      pitch: 0.12,
      yaw: 0.03,
      kickback: 0.14,
      recoverySpeed: 4.5,
      shakeIntensity: 0.12,
    },
    spread: {
      base: 0.08,
      moving: 0.18,
      airborne: 0.25,
      ads: 0.0002,
    },
    ads: {
      position: [0, -0.185, -0.22],
      rotation: [0, 0, 0],
      fovMultiplier: 0.22, // High magnification optical scope
      speed: 10.0,
    },
    anim: {
      hipPosition: [0.24, -0.24, -0.46],
      hipRotation: [0.02, -0.04, 0.01],
      sprintPosition: [0.2, -0.35, -0.38],
      sprintRotation: [-0.4, 0.5, -0.2],
      reloadDip: [0.1, -0.22, 0.08],
      reloadRot: [0.4, -0.25, 0.3],
    },
  },

  SMG: {
    id: 'SMG-9',
    name: 'SMG-9 VIPER',
    category: 'primary',
    description: 'High-fire-rate personal defense weapon equipped with integral suppressor shroud.',
    damage: 22,
    headshotMultiplier: 2.5, // 55 headshot
    fireRate: 850, // ~70ms per bullet
    automatic: true,
    pellets: 1,
    clipSize: 35,
    maxReserveAmmo: 105,
    reloadDuration: 1.8,
    range: 65,
    bulletSpeed: 240,
    tracerColor: '#ffdd55',
    muzzleFlashColor: '#ffcc44',
    recoil: {
      pitch: 0.024,
      yaw: 0.018,
      kickback: 0.038,
      recoverySpeed: 10.0,
      shakeIntensity: 0.025,
    },
    spread: {
      base: 0.03,
      moving: 0.05,
      airborne: 0.08,
      ads: 0.012,
    },
    ads: {
      position: [0, -0.145, -0.30],
      rotation: [0, 0, 0],
      fovMultiplier: 0.82,
      speed: 14.0,
    },
    anim: {
      hipPosition: [0.2, -0.19, -0.38],
      hipRotation: [0.03, -0.06, 0.02],
      sprintPosition: [0.15, -0.28, -0.32],
      sprintRotation: [-0.5, 0.58, -0.28],
      reloadDip: [0.06, -0.14, 0.04],
      reloadRot: [0.32, -0.32, 0.2],
    },
  },

  SG: {
    id: 'SG-12',
    name: 'SG-12 BREACHER',
    category: 'primary',
    description: 'Heavy tactical pump-action 12-gauge shotgun featuring jagged breacher choke and heat shield.',
    damage: 18, // 18 * 8 = 144 close range
    headshotMultiplier: 2.0,
    fireRate: 70, // ~0.85s pump cycle
    automatic: false,
    pellets: 8,
    clipSize: 6,
    maxReserveAmmo: 24,
    reloadDuration: 2.8,
    range: 35,
    bulletSpeed: 200,
    tracerColor: '#ff8822',
    muzzleFlashColor: '#ff6611',
    recoil: {
      pitch: 0.095,
      yaw: 0.035,
      kickback: 0.11,
      recoverySpeed: 6.0,
      shakeIntensity: 0.09,
    },
    spread: {
      base: 0.065,
      moving: 0.095,
      airborne: 0.14,
      ads: 0.045,
    },
    ads: {
      position: [0, -0.168, -0.32],
      rotation: [0, 0, 0],
      fovMultiplier: 0.85,
      speed: 11.0,
    },
    anim: {
      hipPosition: [0.22, -0.22, -0.44],
      hipRotation: [0.02, -0.05, 0.02],
      sprintPosition: [0.18, -0.32, -0.36],
      sprintRotation: [-0.42, 0.52, -0.24],
      reloadDip: [0.08, -0.18, 0.06],
      reloadRot: [0.36, -0.28, 0.28],
    },
  },

  PISTOL: {
    id: 'MK-4',
    name: 'MK-4 DEAGLE',
    category: 'secondary',
    description: 'Chunky .50 caliber heavy handgun with brushed silver slide, ergonomic grip, and laser module.',
    damage: 52,
    headshotMultiplier: 2.5, // 130 headshot
    fireRate: 240, // Semi-auto 250ms
    automatic: false,
    pellets: 1,
    clipSize: 7,
    maxReserveAmmo: 35,
    reloadDuration: 1.6,
    range: 70,
    bulletSpeed: 260,
    tracerColor: '#ffbb44',
    muzzleFlashColor: '#ffaa33',
    recoil: {
      pitch: 0.065,
      yaw: 0.02,
      kickback: 0.07,
      recoverySpeed: 8.0,
      shakeIntensity: 0.055,
    },
    spread: {
      base: 0.015,
      moving: 0.045,
      airborne: 0.08,
      ads: 0.004,
    },
    ads: {
      position: [0, -0.148, -0.30],
      rotation: [0, 0, 0],
      fovMultiplier: 0.84,
      speed: 14.0,
    },
    anim: {
      hipPosition: [0.2, -0.18, -0.36],
      hipRotation: [0.02, -0.04, 0.01],
      sprintPosition: [0.14, -0.26, -0.3],
      sprintRotation: [-0.48, 0.5, -0.22],
      reloadDip: [0.06, -0.12, 0.04],
      reloadRot: [0.3, -0.35, 0.22],
    },
  },

  KNIFE: {
    id: 'K-01',
    name: 'K-01 KARAMBIT',
    category: 'melee',
    description: 'Tactical curved hawkbill combat blade with finger safety ring and vibrant tiger-stripe finish.',
    damage: 65,
    headshotMultiplier: 2.0, // 130 slice
    fireRate: 120, // 0.5s per swing
    automatic: false,
    pellets: 1,
    clipSize: 1,
    maxReserveAmmo: 1,
    reloadDuration: 0,
    range: 2.8,
    bulletSpeed: 0,
    tracerColor: '#ffffff',
    muzzleFlashColor: '#000000',
    recoil: {
      pitch: 0.01,
      yaw: 0.02,
      kickback: 0.03,
      recoverySpeed: 12.0,
      shakeIntensity: 0.015,
    },
    spread: {
      base: 0,
      moving: 0,
      airborne: 0,
      ads: 0,
    },
    ads: {
      position: [0.1, -0.16, -0.32],
      rotation: [0.2, -0.4, 0.3],
      fovMultiplier: 0.95,
      speed: 12.0,
    },
    anim: {
      hipPosition: [0.22, -0.2, -0.36],
      hipRotation: [0.1, -0.15, 0.2],
      sprintPosition: [0.16, -0.28, -0.3],
      sprintRotation: [-0.5, 0.6, -0.35],
      reloadDip: [0, 0, 0],
      reloadRot: [0, 0, 0],
    },
  },
};

export const WEAPONS_CONFIG: Record<string, WeaponConfig> = {
  ...BASE_WEAPONS,
  'AR-76': BASE_WEAPONS.AR,
  'SR-99': BASE_WEAPONS.SR,
  'SMG-9': BASE_WEAPONS.SMG,
  'SG-12': BASE_WEAPONS.SG,
  'MK-4': BASE_WEAPONS.PISTOL,
  'K-01': BASE_WEAPONS.KNIFE,
};

export function getWeaponConfig(id: string): WeaponConfig {
  const norm = normalizeWeaponId(id);
  return BASE_WEAPONS[norm] || BASE_WEAPONS.AR;
}

export const DEFAULT_WEAPON = 'AR-76';
