// ============================================================================
// SHARED TYPES & DEFINITIONS - TACTICAL FPS MULTIPLAYER ENGINE
// ============================================================================

export type Team = 'ALPHA' | 'BRAVO' | 'FFA';
export type GameMode = 'FFA' | 'TDM';

export type WeaponId = 'AR-76' | 'SR-99' | 'SMG-9' | 'SG-12' | 'MK-4' | 'K-01';
export type WeaponSlot = 'primary' | 'secondary' | 'melee';

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface WeaponConfig {
  id: WeaponId;
  name: string;
  category: WeaponSlot;
  damage: number;
  headshotMultiplier: number;
  fireRate: number; // Rounds per minute (RPM)
  fireDelayMs: number; // Milliseconds between shots (60000 / fireRate)
  maxAmmo: number; // Magazine capacity
  reserveAmmo: number; // Total reserve ammo
  reloadTime: number; // In seconds
  range: number; // Effective distance in meters / world units
  spread: number; // Base spread in radians / degrees
  adsSpread: number; // Aim-Down-Sights spread
  recoil: {
    pitch: number; // Vertical kick
    yaw: number; // Horizontal kick
  };
  automatic: boolean;
  pellets?: number; // Shotgun pellet count (SG-12)
  bulletSpeed: number; // Units per second
}

export const WEAPON_CONFIGS: Record<WeaponId, WeaponConfig> = {
  'AR-76': {
    id: 'AR-76',
    name: 'AR-76 VANDAL',
    category: 'primary',
    damage: 34,
    headshotMultiplier: 2.5, // 85 damage headshot
    fireRate: 600,
    fireDelayMs: 100,
    maxAmmo: 30,
    reserveAmmo: 90,
    reloadTime: 2.2,
    range: 120,
    spread: 0.015,
    adsSpread: 0.003,
    recoil: { pitch: 1.2, yaw: 0.4 },
    automatic: true,
    bulletSpeed: 300,
  },
  'SR-99': {
    id: 'SR-99',
    name: 'SR-99 SPECTRE',
    category: 'primary',
    damage: 95,
    headshotMultiplier: 2.5, // 237.5 damage - instant lethal headshot
    fireRate: 45,
    fireDelayMs: 1333,
    maxAmmo: 5,
    reserveAmmo: 20,
    reloadTime: 3.5,
    range: 300,
    spread: 0.08,
    adsSpread: 0.0002,
    recoil: { pitch: 4.5, yaw: 0.8 },
    automatic: false,
    bulletSpeed: 500,
  },
  'SMG-9': {
    id: 'SMG-9',
    name: 'SMG-9 VIPER',
    category: 'primary',
    damage: 22,
    headshotMultiplier: 2.5, // 55 damage headshot
    fireRate: 850,
    fireDelayMs: 70,
    maxAmmo: 35,
    reserveAmmo: 105,
    reloadTime: 1.8,
    range: 65,
    spread: 0.03,
    adsSpread: 0.012,
    recoil: { pitch: 0.8, yaw: 0.6 },
    automatic: true,
    bulletSpeed: 240,
  },
  'SG-12': {
    id: 'SG-12',
    name: 'SG-12 BREACHER',
    category: 'primary',
    damage: 18, // 18 * 8 pellets = 144 max point blank
    headshotMultiplier: 2.0,
    fireRate: 80,
    fireDelayMs: 750,
    maxAmmo: 8,
    reserveAmmo: 32,
    reloadTime: 3.0,
    range: 35,
    spread: 0.065,
    adsSpread: 0.045,
    pellets: 8,
    recoil: { pitch: 3.2, yaw: 1.2 },
    automatic: false,
    bulletSpeed: 180,
  },
  'MK-4': {
    id: 'MK-4',
    name: 'MK-4 DEAGLE',
    category: 'secondary',
    damage: 50,
    headshotMultiplier: 2.5, // 125 headshot damage
    fireRate: 240,
    fireDelayMs: 250,
    maxAmmo: 7,
    reserveAmmo: 28,
    reloadTime: 1.6,
    range: 80,
    spread: 0.02,
    adsSpread: 0.006,
    recoil: { pitch: 2.2, yaw: 0.5 },
    automatic: false,
    bulletSpeed: 280,
  },
  'K-01': {
    id: 'K-01',
    name: 'K-01 KARAMBIT',
    category: 'melee',
    damage: 75,
    headshotMultiplier: 2.0, // 150 critical damage
    fireRate: 120,
    fireDelayMs: 500,
    maxAmmo: 0,
    reserveAmmo: 0,
    reloadTime: 0,
    range: 3.2, // Melee lunge distance
    spread: 0,
    adsSpread: 0,
    recoil: { pitch: 0.2, yaw: 0.2 },
    automatic: false,
    bulletSpeed: 1000,
  },
};

export interface PlayerState {
  id: string; // Socket ID
  nickname: string;
  team: Team;
  position: Vector3D;
  rotation: { x: number; y: number; z: number }; // Pitch (x), Yaw (y), Roll (z)
  velocity: Vector3D;
  isCrouching: boolean;
  isSprinting: boolean;
  isAiming: boolean;
  isReloading: boolean;
  isFiring: boolean;
  isDead: boolean;
  health: number; // 0 - 100
  armor: number; // 0 - 100
  currentWeapon: WeaponId;
  ammo: {
    current: number;
    reserve: number;
  };
  score: number;
  kills: number;
  deaths: number;
  assists: number;
  ping: number;
  lastProcessedInput?: number;
  respawnAt?: number; // Epoch timestamp when player will respawn
}

export interface BulletData {
  id: string;
  shooterId: string;
  weaponId: WeaponId;
  origin: Vector3D;
  direction: Vector3D;
  timestamp: number;
  speed: number;
}

export type HitboxType = 'head' | 'body' | 'limb';

export interface HitEvent {
  id: string;
  shooterId: string;
  targetId: string;
  weaponId: WeaponId;
  hitbox: HitboxType;
  damage: number;
  absorbedDamage: number;
  healthDamage: number;
  hitPosition: Vector3D;
  isKill: boolean;
  isHeadshot: boolean;
  timestamp: number;
}

export interface KillfeedEntry {
  id: string;
  killerId: string;
  killerName: string;
  killerTeam: Team;
  victimId: string;
  victimName: string;
  victimTeam: Team;
  weaponId: WeaponId;
  isHeadshot: boolean;
  timestamp: number;
}

export type MatchStatus = 'waiting' | 'in_progress' | 'ended';

export interface MatchState {
  status: MatchStatus;
  timeRemaining: number; // In seconds
  totalMatchTime: number; // Default 600s (10 min)
  scoreAlpha: number;
  scoreBravo: number;
  targetScore: number; // e.g. 50 in TDM, 30 in FFA
  winnerTeam: Team | null;
}

export interface Room {
  id: string; // 6-digit alphanumeric code e.g. "X7K9M2"
  name: string;
  hostId: string;
  mode: GameMode;
  maxPlayers: number;
  players: Record<string, PlayerState>;
  matchState: MatchState;
  createdAt: number;
}

// ----------------------------------------------------------------------------
// Client-Server Protocol Interfaces
// ----------------------------------------------------------------------------

export interface PlayerInputPayload {
  position: Vector3D;
  rotation: { x: number; y: number; z: number };
  velocity: Vector3D;
  isCrouching: boolean;
  isSprinting: boolean;
  isAiming: boolean;
  sequenceNumber: number;
  timestamp: number;
}

export interface PlayerFirePayload {
  weaponId: WeaponId;
  origin: Vector3D;
  direction: Vector3D;
  timestamp: number;
}

export interface PlayerHitPayload {
  targetId: string;
  weaponId: WeaponId;
  hitbox: HitboxType;
  hitPosition: Vector3D;
  clientTimestamp: number;
}

export interface CreateRoomPayload {
  nickname: string;
  roomName?: string;
  mode: GameMode;
  team?: Team;
  maxPlayers?: number;
}

export interface JoinRoomPayload {
  roomCode: string;
  nickname: string;
  preferredTeam?: Team;
}

export interface QuickMatchPayload {
  nickname: string;
  preferredMode?: GameMode;
}

export interface ServerStateSnapshot {
  timestamp: number;
  players: PlayerState[];
  matchState: MatchState;
}

// Socket.io Event Definitions
export interface ServerToClientEvents {
  'room:joined': (data: { room: Room; playerId: string }) => void;
  'room:error': (data: { message: string }) => void;
  'room:playerJoined': (data: { player: PlayerState }) => void;
  'room:playerLeft': (data: { playerId: string; newHostId?: string }) => void;
  'game:stateUpdate': (snapshot: ServerStateSnapshot) => void;
  'game:playerFired': (bullet: BulletData) => void;
  'game:playerHit': (hit: HitEvent) => void;
  'game:playerDied': (data: {
    victimId: string;
    killerId: string;
    killfeed: KillfeedEntry;
    respawnAt: number;
  }) => void;
  'game:playerRespawn': (data: {
    playerId: string;
    position: Vector3D;
    rotation: { x: number; y: number; z: number };
    health: number;
    armor: number;
  }) => void;
  'game:killfeed': (entry: KillfeedEntry) => void;
  'game:matchEnd': (data: {
    winnerTeam: Team | null;
    scoreAlpha: number;
    scoreBravo: number;
  }) => void;
  'pong:latency': (data: { clientTimestamp: number; serverTimestamp: number }) => void;
}

export interface ClientToServerEvents {
  'room:create': (payload: CreateRoomPayload) => void;
  'room:join': (payload: JoinRoomPayload) => void;
  'room:quickMatch': (payload: QuickMatchPayload) => void;
  'room:leave': () => void;
  'player:input': (payload: PlayerInputPayload) => void;
  'player:fire': (payload: PlayerFirePayload) => void;
  'player:hit': (payload: PlayerHitPayload) => void;
  'player:reload': () => void;
  'player:switchWeapon': (data: { weaponId: WeaponId }) => void;
  'ping:latency': (data: { timestamp: number }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  playerId: string;
  roomId?: string;
  nickname?: string;
}
