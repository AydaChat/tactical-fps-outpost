import { create } from 'zustand';
import {
  PlayerState,
  Room,
  WeaponId,
  WEAPON_CONFIGS,
  KillfeedEntry,
  DamageIndicator,
  HitmarkerData,
  AudioSettings,
  GraphicsSettings,
  ControlSettings,
  WeaponLoadout,
  Team,
  GameMode,
  MatchState,
  Vector3D,
} from '@/types/game';

interface GameStoreState {
  // Session & Connection
  playerId: string;
  nickname: string;
  preferredTeam: Team;
  isInGame: boolean;
  isConnecting: boolean;
  connectionError: string | null;
  currentRoom: Room | null;
  matchState: MatchState;
  ping: number;

  // Local Player In-Game State
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  isDead: boolean;
  respawnTimeRemaining: number;
  currentWeaponId: WeaponId;
  ammo: {
    current: number;
    reserve: number;
  };
  isReloading: boolean;
  isAiming: boolean;
  isSprinting: boolean;
  isCrouching: boolean;
  isFiring: boolean;
  position: Vector3D;
  rotation: { x: number; y: number; z: number };
  velocity: Vector3D;

  // Loadout
  loadout: WeaponLoadout;

  // Network Players
  players: Record<string, PlayerState>;

  // Combat Events & UI Feedback
  killfeed: KillfeedEntry[];
  hitmarkers: HitmarkerData[];
  damageIndicators: DamageIndicator[];
  recoilOffset: { pitch: number; yaw: number };
  activeFps: number;

  // UI Overlays
  isScoreboardOpen: boolean;
  isSettingsOpen: boolean;

  // Settings
  audioSettings: AudioSettings;
  graphicsSettings: GraphicsSettings;
  controlSettings: ControlSettings;

  // Actions
  setNickname: (name: string) => void;
  setPreferredTeam: (team: Team) => void;
  setLoadout: (loadout: Partial<WeaponLoadout>) => void;
  setConnecting: (isConnecting: boolean, error?: string | null) => void;
  setInGame: (isInGame: boolean) => void;
  setPing: (ping: number) => void;
  setActiveFps: (fps: number) => void;

  // Room Actions
  setRoomJoined: (room: Room, localPlayerId: string) => void;
  updateRoom: (room: Partial<Room>) => void;
  updateMatchState: (state: Partial<MatchState>) => void;
  leaveRoom: () => void;

  // Player Actions
  updateLocalPlayer: (partial: Partial<PlayerState>) => void;
  setHealthArmor: (health: number, armor: number) => void;
  takeDamage: (damage: number, attackerAngle?: number) => void;
  triggerDeath: (respawnAt: number) => void;
  triggerRespawn: (pos: Vector3D, rot: { x: number; y: number; z: number }) => void;
  switchWeapon: (weaponId: WeaponId) => void;
  consumeAmmo: () => boolean;
  startReload: () => void;
  finishReload: () => void;
  setAiming: (isAiming: boolean) => void;
  setSprinting: (isSprinting: boolean) => void;
  setCrouching: (isCrouching: boolean) => void;
  setFiring: (isFiring: boolean) => void;
  applyRecoil: (pitch: number, yaw: number) => void;
  decayRecoil: (deltaFactor: number) => void;

  // Multiplayer State Updates
  syncServerSnapshot: (players: PlayerState[], matchState: MatchState) => void;
  addPlayer: (player: PlayerState) => void;
  removePlayer: (playerId: string) => void;

  // Combat UI Actions
  startPracticeMode: (mode?: GameMode) => void;
  damageBot: (botId: string, damage: number, isHeadshot: boolean, hitPoint?: { x: number; y: number; z: number }) => boolean;
  addKillfeedEntry: (entry: KillfeedEntry) => void;
  pruneKillfeed: () => void;
  addHitmarker: (type: 'body' | 'headshot' | 'kill') => void;
  pruneHitmarkers: () => void;
  addDamageIndicator: (angle: number, damage: number) => void;
  pruneDamageIndicators: () => void;

  // UI Visibility
  setScoreboardOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;

  // Settings Actions
  updateAudioSettings: (settings: Partial<AudioSettings>) => void;
  updateGraphicsSettings: (settings: Partial<GraphicsSettings>) => void;
  updateControlSettings: (settings: Partial<ControlSettings>) => void;
  resetSettingsToDefault: () => void;
}

const DEFAULT_LOADOUT: WeaponLoadout = {
  primary: 'AR-76',
  secondary: 'MK-4',
  melee: 'K-01',
};

const DEFAULT_AUDIO: AudioSettings = {
  masterVolume: 80,
  sfxVolume: 90,
  musicVolume: 40,
  voiceVolume: 75,
  hitmarkerVolume: 100,
};

const DEFAULT_GRAPHICS: GraphicsSettings = {
  fov: 85,
  showFps: true,
  screenShake: true,
  crosshairColor: '#00f0ff',
  crosshairSize: 6,
  crosshairGap: 4,
  crosshairDot: true,
};

const DEFAULT_CONTROLS: ControlSettings = {
  mouseSensitivity: 1.2,
  invertY: false,
  adsSensitivityMultiplier: 0.8,
};

const INITIAL_MATCH_STATE: MatchState = {
  status: 'waiting',
  timeRemaining: 600,
  totalMatchTime: 600,
  scoreAlpha: 0,
  scoreBravo: 0,
  targetScore: 50,
  winnerTeam: null,
};

// Initial nickname from local storage if available
const getStoredNickname = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('tactical_fps_nickname');
    if (saved && saved.trim()) return saved.trim().substring(0, 16);
  }
  return `OPERATOR-${Math.floor(1000 + Math.random() * 9000)}`;
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  // Session
  playerId: '',
  nickname: getStoredNickname(),
  preferredTeam: 'ALPHA',
  isInGame: false,
  isConnecting: false,
  connectionError: null,
  currentRoom: null,
  matchState: INITIAL_MATCH_STATE,
  ping: 18,

  // Local Player
  health: 100,
  maxHealth: 100,
  armor: 50,
  maxArmor: 100,
  isDead: false,
  respawnTimeRemaining: 0,
  currentWeaponId: 'AR-76',
  ammo: {
    current: WEAPON_CONFIGS['AR-76'].maxAmmo,
    reserve: WEAPON_CONFIGS['AR-76'].reserveAmmo,
  },
  isReloading: false,
  isAiming: false,
  isSprinting: false,
  isCrouching: false,
  isFiring: false,
  position: { x: 0, y: 1.6, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  velocity: { x: 0, y: 0, z: 0 },

  // Loadout
  loadout: DEFAULT_LOADOUT,

  // Network players
  players: {},

  // Combat Feedback
  killfeed: [],
  hitmarkers: [],
  damageIndicators: [],
  recoilOffset: { pitch: 0, yaw: 0 },
  activeFps: 60,

  // UI Overlays
  isScoreboardOpen: false,
  isSettingsOpen: false,

  // Settings
  audioSettings: DEFAULT_AUDIO,
  graphicsSettings: DEFAULT_GRAPHICS,
  controlSettings: DEFAULT_CONTROLS,

  // Basic Actions
  setNickname: (name: string) => {
    const clean = name.trim().substring(0, 16);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tactical_fps_nickname', clean);
    }
    set({ nickname: clean });
  },

  setPreferredTeam: (team: Team) => set({ preferredTeam: team }),

  setLoadout: (partial) => {
    set((state) => {
      const updated = { ...state.loadout, ...partial };
      // If current weapon is slot being updated, switch to it
      let currentWep = state.currentWeaponId;
      if (partial.primary && state.currentWeaponId === state.loadout.primary) {
        currentWep = partial.primary;
      }
      const config = WEAPON_CONFIGS[currentWep];
      return {
        loadout: updated,
        currentWeaponId: currentWep,
        ammo: { current: config.maxAmmo, reserve: config.reserveAmmo },
      };
    });
  },

  setConnecting: (isConnecting, error = null) =>
    set({ isConnecting, connectionError: error }),

  setInGame: (isInGame) => set({ isInGame }),

  setPing: (ping) => set({ ping }),

  setActiveFps: (fps) => set({ activeFps: fps }),

  // Room Actions
  setRoomJoined: (room: Room, localPlayerId: string) => {
    const localPlayer = room.players[localPlayerId];
    const initialWeapon = localPlayer?.currentWeapon || get().loadout.primary;
    const config = WEAPON_CONFIGS[initialWeapon];

    set({
      playerId: localPlayerId,
      currentRoom: room,
      matchState: room.matchState,
      isInGame: true,
      isConnecting: false,
      connectionError: null,
      health: localPlayer ? localPlayer.health : 100,
      armor: localPlayer ? localPlayer.armor : 50,
      isDead: localPlayer ? localPlayer.isDead : false,
      currentWeaponId: initialWeapon,
      ammo: {
        current: localPlayer?.ammo?.current ?? config.maxAmmo,
        reserve: localPlayer?.ammo?.reserve ?? config.reserveAmmo,
      },
      players: room.players,
    });
  },

  updateRoom: (partial) =>
    set((state) => ({
      currentRoom: state.currentRoom ? { ...state.currentRoom, ...partial } : null,
    })),

  updateMatchState: (partial) =>
    set((state) => ({
      matchState: { ...state.matchState, ...partial },
    })),

  leaveRoom: () =>
    set({
      isInGame: false,
      currentRoom: null,
      players: {},
      isScoreboardOpen: false,
      isSettingsOpen: false,
      killfeed: [],
      damageIndicators: [],
      hitmarkers: [],
      isDead: false,
    }),

  startPracticeMode: (mode = 'TDM') => {
    const state = get();
    const localId = 'local_operator';
    const playerTeam = state.preferredTeam || 'ALPHA';
    const enemyTeam = playerTeam === 'ALPHA' ? 'BRAVO' : 'ALPHA';
    const primaryWep = state.loadout.primary;
    const config = WEAPON_CONFIGS[primaryWep];

    const localPlayer: PlayerState = {
      id: localId,
      nickname: state.nickname || 'OPERATOR-99',
      team: playerTeam,
      position: { x: 0, y: 1.6, z: 2 },
      rotation: { x: 0, y: 0, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      health: 100,
      armor: 50,
      isDead: false,
      isCrouching: false,
      isSprinting: false,
      isFiring: false,
      isReloading: false,
      isAiming: false,
      currentWeapon: primaryWep,
      kills: 0,
      deaths: 0,
      assists: 0,
      score: 0,
      ping: 5,
      ammo: { current: config.maxAmmo, reserve: config.reserveAmmo },
    };

    const bots: Record<string, PlayerState> = {
      [localId]: localPlayer,
      'bot_vanguard': {
        id: 'bot_vanguard',
        nickname: 'BOT-VANGUARD',
        team: enemyTeam,
        position: { x: 12, y: 0.5, z: 15 },
        rotation: { x: 0, y: Math.PI, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        health: 100,
        armor: 50,
        isDead: false,
        isCrouching: false,
        isSprinting: false,
        isFiring: false,
        isReloading: false,
        isAiming: false,
        currentWeapon: 'AR-76',
        kills: 0,
        deaths: 0,
        assists: 0,
        score: 0,
        ping: 10,
        ammo: { current: 30, reserve: 90 },
      },
      'bot_spectre': {
        id: 'bot_spectre',
        nickname: 'BOT-SPECTRE',
        team: enemyTeam,
        position: { x: 0, y: 8.5, z: -28 }, // North Tower Deck
        rotation: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        health: 100,
        armor: 50,
        isDead: false,
        isCrouching: false,
        isSprinting: false,
        isFiring: false,
        isReloading: false,
        isAiming: false,
        currentWeapon: 'SR-99',
        kills: 0,
        deaths: 0,
        assists: 0,
        score: 0,
        ping: 15,
        ammo: { current: 5, reserve: 25 },
      },
      'bot_viper': {
        id: 'bot_viper',
        nickname: 'BOT-VIPER',
        team: enemyTeam,
        position: { x: -16, y: 4.5, z: 0 }, // Mid Platform
        rotation: { x: 0, y: Math.PI / 2, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        health: 100,
        armor: 50,
        isDead: false,
        isCrouching: false,
        isSprinting: false,
        isFiring: false,
        isReloading: false,
        isAiming: false,
        currentWeapon: 'SMG-9',
        kills: 0,
        deaths: 0,
        assists: 0,
        score: 0,
        ping: 12,
        ammo: { current: 35, reserve: 105 },
      },
      'bot_breacher': {
        id: 'bot_breacher',
        nickname: 'BOT-BREACHER',
        team: enemyTeam,
        position: { x: -12, y: 0.5, z: -15 }, // Corridor Flank
        rotation: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        health: 100,
        armor: 50,
        isDead: false,
        isCrouching: false,
        isSprinting: false,
        isFiring: false,
        isReloading: false,
        isAiming: false,
        currentWeapon: 'SG-12',
        kills: 0,
        deaths: 0,
        assists: 0,
        score: 0,
        ping: 14,
        ammo: { current: 8, reserve: 32 },
      },
    };

    const practiceRoom: Room = {
      id: 'SOLO01',
      name: 'OUTPOST-09 PRACTICE ARENA',
      mode,
      maxPlayers: 8,
      createdAt: Date.now(),
      hostId: localId,
      players: bots,
      matchState: {
        status: 'in_progress',
        timeRemaining: 600,
        totalMatchTime: 600,
        scoreAlpha: 0,
        scoreBravo: 0,
        targetScore: mode === 'TDM' ? 50 : 30,
        winnerTeam: null,
      },
    };

    set({
      playerId: localId,
      currentRoom: practiceRoom,
      matchState: practiceRoom.matchState,
      isInGame: true,
      isConnecting: false,
      connectionError: null,
      health: 100,
      armor: 50,
      isDead: false,
      currentWeaponId: primaryWep,
      ammo: { current: config.maxAmmo, reserve: config.reserveAmmo },
      players: bots,
    });
  },

  damageBot: (botId: string, damage: number, isHeadshot: boolean, hitPoint?: { x: number; y: number; z: number }) => {
    const state = get();
    const bot = state.players[botId];
    if (!bot || bot.isDead) return false;

    // Apply armor reduction (65% absorbed by armor)
    let appliedDamage = damage;
    let newArmor = bot.armor;
    if (newArmor > 0) {
      const absorbed = Math.min(newArmor, Math.floor(damage * 0.65));
      newArmor -= absorbed;
      appliedDamage -= absorbed;
    }
    const newHealth = Math.max(0, bot.health - appliedDamage);
    const isKilled = newHealth <= 0;

    // Trigger hitmarker on local HUD
    state.addHitmarker(isKilled ? 'kill' : isHeadshot ? 'headshot' : 'body');

    // Update bot state
    set((s) => ({
      players: {
        ...s.players,
        [botId]: {
          ...bot,
          health: newHealth,
          armor: newArmor,
          isDead: isKilled,
        },
      },
    }));

    if (isKilled) {
      const killerName = state.nickname || 'OPERATOR';
      const points = isHeadshot ? 150 : 100;

      // Add killfeed entry
      state.addKillfeedEntry({
        id: `kill_${Date.now()}_${Math.random()}`,
        killerId: state.playerId,
        killerName,
        killerTeam: state.preferredTeam || 'ALPHA',
        victimId: botId,
        victimName: bot.nickname,
        victimTeam: bot.team,
        weaponId: state.currentWeaponId,
        isHeadshot,
        timestamp: Date.now(),
      });

      // Update match scores
      set((s) => {
        const isAlpha = state.preferredTeam === 'ALPHA';
        return {
          matchState: {
            ...s.matchState,
            scoreAlpha: s.matchState.scoreAlpha + (isAlpha ? 1 : 0),
            scoreBravo: s.matchState.scoreBravo + (!isAlpha ? 1 : 0),
          },
        };
      });

      // Schedule bot respawn after 3.5 seconds
      setTimeout(() => {
        const currentBot = get().players[botId];
        if (currentBot && currentBot.isDead) {
          // Select one of the spawn coordinates
          const spawns = [
            { x: 12, y: 0.5, z: 15 },
            { x: -12, y: 0.5, z: -15 },
            { x: 0, y: 8.5, z: -28 },
            { x: -16, y: 4.5, z: 0 },
            { x: 15, y: 4.5, z: 0 },
          ];
          const spawn = spawns[Math.floor(Math.random() * spawns.length)];
          set((s) => ({
            players: {
              ...s.players,
              [botId]: {
                ...currentBot,
                position: spawn,
                health: 100,
                armor: 50,
                isDead: false,
              },
            },
          }));
        }
      }, 3500);
    }

    return true;
  },

  // Player Actions
  updateLocalPlayer: (partial) =>
    set((state) => ({
      health: partial.health !== undefined ? partial.health : state.health,
      armor: partial.armor !== undefined ? partial.armor : state.armor,
      isDead: partial.isDead !== undefined ? partial.isDead : state.isDead,
      position: partial.position || state.position,
      rotation: partial.rotation || state.rotation,
      velocity: partial.velocity || state.velocity,
      isSprinting: partial.isSprinting !== undefined ? partial.isSprinting : state.isSprinting,
      isCrouching: partial.isCrouching !== undefined ? partial.isCrouching : state.isCrouching,
      isAiming: partial.isAiming !== undefined ? partial.isAiming : state.isAiming,
    })),

  setHealthArmor: (health, armor) =>
    set({
      health: Math.max(0, Math.min(100, health)),
      armor: Math.max(0, Math.min(100, armor)),
      isDead: health <= 0,
    }),

  takeDamage: (damage: number, attackerAngle?: number) => {
    set((state) => {
      // Armor absorbs 50% damage
      let remainingDamage = damage;
      let newArmor = state.armor;
      if (newArmor > 0) {
        const armorAbsorb = Math.min(newArmor, Math.floor(damage * 0.5));
        newArmor -= armorAbsorb;
        remainingDamage -= armorAbsorb;
      }
      const newHealth = Math.max(0, state.health - remainingDamage);
      const isDead = newHealth <= 0;

      // Add directional indicator
      const indicators = [...state.damageIndicators];
      if (attackerAngle !== undefined) {
        indicators.push({
          id: `${Date.now()}_${Math.random()}`,
          angle: attackerAngle,
          damage,
          timestamp: Date.now(),
        });
      }

      return {
        health: newHealth,
        armor: newArmor,
        isDead,
        damageIndicators: indicators,
      };
    });
  },

  triggerDeath: (respawnAt: number) => {
    const remaining = Math.max(0, (respawnAt - Date.now()) / 1000);
    set({
      isDead: true,
      health: 0,
      armor: 0,
      isAiming: false,
      isReloading: false,
      isFiring: false,
      respawnTimeRemaining: remaining,
    });
  },

  triggerRespawn: (pos, rot) => {
    const currentWep = get().currentWeaponId;
    const config = WEAPON_CONFIGS[currentWep];
    set({
      isDead: false,
      health: 100,
      armor: 50,
      position: pos,
      rotation: rot,
      ammo: {
        current: config.maxAmmo,
        reserve: config.reserveAmmo,
      },
      respawnTimeRemaining: 0,
      isAiming: false,
      isReloading: false,
      isFiring: false,
    });
  },

  switchWeapon: (weaponId: WeaponId) => {
    const config = WEAPON_CONFIGS[weaponId];
    if (!config) return;
    set({
      currentWeaponId: weaponId,
      isReloading: false,
      isAiming: false,
      isFiring: false,
      ammo: {
        current: config.maxAmmo,
        reserve: config.reserveAmmo,
      },
    });
  },

  consumeAmmo: () => {
    const { ammo, currentWeaponId, isReloading } = get();
    if (isReloading || ammo.current <= 0) return false;

    // Melee has infinite pseudo-ammo
    if (currentWeaponId === 'K-01') return true;

    set({
      ammo: {
        ...ammo,
        current: ammo.current - 1,
      },
    });
    return true;
  },

  startReload: () => {
    const { ammo, isReloading, currentWeaponId } = get();
    const config = WEAPON_CONFIGS[currentWeaponId];
    if (isReloading || ammo.current >= config.maxAmmo || ammo.reserve <= 0) {
      return;
    }
    set({ isReloading: true, isAiming: false });
  },

  finishReload: () => {
    const { ammo, currentWeaponId, isReloading } = get();
    if (!isReloading) return;
    const config = WEAPON_CONFIGS[currentWeaponId];
    const needed = config.maxAmmo - ammo.current;
    const transfer = Math.min(needed, ammo.reserve);

    set({
      isReloading: false,
      ammo: {
        current: ammo.current + transfer,
        reserve: ammo.reserve - transfer,
      },
    });
  },

  setAiming: (isAiming) => set({ isAiming }),
  setSprinting: (isSprinting) => set({ isSprinting, isAiming: isSprinting ? false : get().isAiming }),
  setCrouching: (isCrouching) => set({ isCrouching }),
  setFiring: (isFiring) => set({ isFiring }),

  applyRecoil: (pitch, yaw) => {
    set((state) => ({
      recoilOffset: {
        pitch: state.recoilOffset.pitch + pitch,
        yaw: state.recoilOffset.yaw + (Math.random() - 0.5) * yaw,
      },
    }));
  },

  decayRecoil: (deltaFactor) => {
    set((state) => ({
      recoilOffset: {
        pitch: Math.max(0, state.recoilOffset.pitch * (1 - deltaFactor)),
        yaw: state.recoilOffset.yaw * (1 - deltaFactor),
      },
    }));
  },

  // Multiplayer State Updates
  syncServerSnapshot: (playersList, matchState) => {
    const playerMap: Record<string, PlayerState> = {};
    const localId = get().playerId;

    for (const p of playersList) {
      playerMap[p.id] = p;
      if (p.id === localId) {
        // Sync vital server authoritative data
        set((state) => ({
          health: p.health,
          armor: p.armor,
          isDead: p.isDead,
          ping: p.ping,
          respawnTimeRemaining:
            p.isDead && p.respawnAt ? Math.max(0, (p.respawnAt - Date.now()) / 1000) : 0,
        }));
      }
    }

    set({
      players: playerMap,
      matchState,
    });
  },

  addPlayer: (player) =>
    set((state) => ({
      players: {
        ...state.players,
        [player.id]: player,
      },
    })),

  removePlayer: (playerId) =>
    set((state) => {
      const next = { ...state.players };
      delete next[playerId];
      return { players: next };
    }),

  // Combat UI Actions
  addKillfeedEntry: (entry) => {
    set((state) => ({
      killfeed: [entry, ...state.killfeed].slice(0, 6),
    }));
  },

  pruneKillfeed: () => {
    const now = Date.now();
    set((state) => ({
      killfeed: state.killfeed.filter((item) => now - item.timestamp < 6000),
    }));
  },

  addHitmarker: (type) => {
    set((state) => ({
      hitmarkers: [...state.hitmarkers, { type, timestamp: Date.now() }],
    }));
  },

  pruneHitmarkers: () => {
    const now = Date.now();
    set((state) => ({
      hitmarkers: state.hitmarkers.filter((m) => now - m.timestamp < 250),
    }));
  },

  addDamageIndicator: (angle, damage) => {
    set((state) => ({
      damageIndicators: [
        ...state.damageIndicators,
        { id: `${Date.now()}_${Math.random()}`, angle, damage, timestamp: Date.now() },
      ],
    }));
  },

  pruneDamageIndicators: () => {
    const now = Date.now();
    set((state) => ({
      damageIndicators: state.damageIndicators.filter((d) => now - d.timestamp < 1800),
    }));
  },

  // UI Visibility
  setScoreboardOpen: (open) => set({ isScoreboardOpen: open }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),

  // Settings Actions
  updateAudioSettings: (settings) =>
    set((state) => ({ audioSettings: { ...state.audioSettings, ...settings } })),

  updateGraphicsSettings: (settings) =>
    set((state) => ({ graphicsSettings: { ...state.graphicsSettings, ...settings } })),

  updateControlSettings: (settings) =>
    set((state) => ({ controlSettings: { ...state.controlSettings, ...settings } })),

  resetSettingsToDefault: () =>
    set({
      audioSettings: DEFAULT_AUDIO,
      graphicsSettings: DEFAULT_GRAPHICS,
      controlSettings: DEFAULT_CONTROLS,
    }),
}));
