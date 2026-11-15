export * from '@shared/types';
import { WeaponId, Team } from '@shared/types';

export interface WeaponLoadout {
  primary: WeaponId;   // 'AR-76' | 'SR-99' | 'SMG-9' | 'SG-12'
  secondary: WeaponId; // 'MK-4'
  melee: WeaponId;     // 'K-01'
}

export interface DamageIndicator {
  id: string;
  angle: number; // 0 = front, 90 = right, 180 = behind, 270 = left
  damage: number;
  timestamp: number;
}

export interface HitmarkerData {
  type: 'body' | 'headshot' | 'kill';
  timestamp: number;
}

export interface AudioSettings {
  masterVolume: number; // 0 - 100
  sfxVolume: number; // 0 - 100
  musicVolume: number; // 0 - 100
  voiceVolume: number; // 0 - 100
  hitmarkerVolume: number; // 0 - 100
}

export interface GraphicsSettings {
  fov: number; // 60 - 110
  showFps: boolean;
  screenShake: boolean;
  crosshairColor: string;
  crosshairSize: number;
  crosshairGap: number;
  crosshairDot: boolean;
}

export interface ControlSettings {
  mouseSensitivity: number; // 0.1 - 5.0
  invertY: boolean;
  adsSensitivityMultiplier: number; // 0.2 - 2.0
}
