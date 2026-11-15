import {
  GameMode,
  MatchState,
  PlayerState,
  Room,
  Team,
  Vector3D,
  WEAPON_CONFIGS,
  WeaponId,
} from '../shared/types';

export const SPAWN_POINTS: Record<Team, Vector3D[]> = {
  ALPHA: [
    { x: -28, y: 1.0, z: -20 },
    { x: -25, y: 1.0, z: -24 },
    { x: -20, y: 1.0, z: -18 },
    { x: -30, y: 1.0, z: -15 },
  ],
  BRAVO: [
    { x: 28, y: 1.0, z: 20 },
    { x: 25, y: 1.0, z: 24 },
    { x: 20, y: 1.0, z: 18 },
    { x: 30, y: 1.0, z: 15 },
  ],
  FFA: [
    { x: -25, y: 1.0, z: -20 },
    { x: 25, y: 1.0, z: 20 },
    { x: -25, y: 1.0, z: 20 },
    { x: 25, y: 1.0, z: -20 },
    { x: 0, y: 1.0, z: -25 },
    { x: 0, y: 1.0, z: 25 },
    { x: -15, y: 4.0, z: 0 },
    { x: 15, y: 4.0, z: 0 },
  ],
};

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerToRoom: Map<string, string> = new Map(); // socketId -> roomCode

  /**
   * Generates a collision-free 6-character uppercase alphanumeric room code.
   * Excludes ambiguous characters (0, O, 1, I).
   */
  public generateRoomCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  /**
   * Calculate distance between two 3D points
   */
  private distance(a: Vector3D, b: Vector3D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Selects an optimal spawn point for a player.
   * If enemies are present, selects the spawn point with the greatest minimum distance to enemies.
   */
  public getOptimalSpawnPoint(room: Room, team: Team, playerId?: string): Vector3D {
    const pool = SPAWN_POINTS[team] || SPAWN_POINTS.FFA;
    const otherPlayers = Object.values(room.players).filter(
      (p) => p.id !== playerId && !p.isDead && (room.mode === 'FFA' || p.team !== team)
    );

    if (otherPlayers.length === 0) {
      // Pick random spawn point from pool
      return { ...pool[Math.floor(Math.random() * pool.length)] };
    }

    let bestSpawn = pool[0];
    let maxMinDist = -1;

    for (const spawn of pool) {
      let minDistToEnemy = Infinity;
      for (const enemy of otherPlayers) {
        const dist = this.distance(spawn, enemy.position);
        if (dist < minDistToEnemy) {
          minDistToEnemy = dist;
        }
      }

      if (minDistToEnemy > maxMinDist) {
        maxMinDist = minDistToEnemy;
        bestSpawn = spawn;
      }
    }

    // Add slight random offset to prevent exact overlapping if two players spawn together
    return {
      x: bestSpawn.x + (Math.random() - 0.5) * 1.5,
      y: bestSpawn.y,
      z: bestSpawn.z + (Math.random() - 0.5) * 1.5,
    };
  }

  /**
   * Create a fresh player state
   */
  public createPlayerState(
    playerId: string,
    nickname: string,
    team: Team,
    spawnPoint: Vector3D,
    initialWeapon: WeaponId = 'AR-76'
  ): PlayerState {
    const weaponConfig = WEAPON_CONFIGS[initialWeapon] || WEAPON_CONFIGS['AR-76'];
    const yaw = team === 'BRAVO' ? Math.PI : 0;

    return {
      id: playerId,
      nickname: nickname.trim().slice(0, 16) || `Agent_${playerId.slice(0, 4)}`,
      team,
      position: { ...spawnPoint },
      rotation: { x: 0, y: yaw, z: 0 },
      velocity: { x: 0, y: 0, z: 0 },
      isCrouching: false,
      isSprinting: false,
      isAiming: false,
      isReloading: false,
      isFiring: false,
      isDead: false,
      health: 100,
      armor: 100,
      currentWeapon: initialWeapon,
      ammo: {
        current: weaponConfig.maxAmmo,
        reserve: weaponConfig.reserveAmmo,
      },
      score: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      ping: 0,
    };
  }

  /**
   * Create a new custom Room
   */
  public createRoom(
    hostId: string,
    options: {
      nickname: string;
      roomName?: string;
      mode?: GameMode;
      team?: Team;
      maxPlayers?: number;
    }
  ): { room: Room; player: PlayerState } {
    const code = this.generateRoomCode();
    const mode = options.mode || 'TDM';
    const maxPlayers = options.maxPlayers || (mode === 'TDM' ? 10 : 8);

    let assignedTeam: Team = 'FFA';
    if (mode === 'TDM') {
      assignedTeam = options.team && options.team !== 'FFA' ? options.team : 'ALPHA';
    }

    const matchState: MatchState = {
      status: 'in_progress',
      timeRemaining: 600, // 10 minutes
      totalMatchTime: 600,
      scoreAlpha: 0,
      scoreBravo: 0,
      targetScore: mode === 'TDM' ? 50 : 30,
      winnerTeam: null,
    };

    const room: Room = {
      id: code,
      name: options.roomName || `Arena [${code}]`,
      hostId,
      mode,
      maxPlayers,
      players: {},
      matchState,
      createdAt: Date.now(),
    };

    const spawnPoint = this.getOptimalSpawnPoint(room, assignedTeam, hostId);
    const player = this.createPlayerState(hostId, options.nickname, assignedTeam, spawnPoint);

    room.players[hostId] = player;
    this.rooms.set(code, room);
    this.playerToRoom.set(hostId, code);

    return { room, player };
  }

  /**
   * Automatically balance teams for TDM rooms
   */
  public balanceTeam(room: Room, preferredTeam?: Team): Team {
    if (room.mode === 'FFA') return 'FFA';

    let alphaCount = 0;
    let bravoCount = 0;

    for (const player of Object.values(room.players)) {
      if (player.team === 'ALPHA') alphaCount++;
      else if (player.team === 'BRAVO') bravoCount++;
    }

    if (preferredTeam === 'ALPHA' && alphaCount <= bravoCount + 1) {
      return 'ALPHA';
    }
    if (preferredTeam === 'BRAVO' && bravoCount <= alphaCount + 1) {
      return 'BRAVO';
    }

    return alphaCount <= bravoCount ? 'ALPHA' : 'BRAVO';
  }

  /**
   * Join an existing room by its 6-digit code
   */
  public joinRoom(
    roomCode: string,
    playerId: string,
    options: {
      nickname: string;
      preferredTeam?: Team;
    }
  ): { success: boolean; room?: Room; player?: PlayerState; error?: string } {
    const code = roomCode.trim().toUpperCase();
    const room = this.rooms.get(code);

    if (!room) {
      return { success: false, error: `Room ${code} not found.` };
    }

    const currentCount = Object.keys(room.players).length;
    if (currentCount >= room.maxPlayers) {
      return { success: false, error: `Room ${code} is full (${room.maxPlayers}/${room.maxPlayers}).` };
    }

    // Leave any previous room
    this.leaveRoom(playerId);

    const team = this.balanceTeam(room, options.preferredTeam);
    const spawnPoint = this.getOptimalSpawnPoint(room, team, playerId);
    const player = this.createPlayerState(playerId, options.nickname, team, spawnPoint);

    room.players[playerId] = player;
    this.playerToRoom.set(playerId, code);

    return { success: true, room, player };
  }

  /**
   * Quick Matchmaking: finds an available public room with slots or creates one automatically.
   */
  public quickMatch(
    playerId: string,
    options: {
      nickname: string;
      preferredMode?: GameMode;
    }
  ): { room: Room; player: PlayerState; isNewRoom: boolean } {
    const mode = options.preferredMode || 'TDM';

    // Search for existing room with available slots
    for (const room of Array.from(this.rooms.values())) {
      const currentPlayers = Object.keys(room.players).length;
      if (
        room.mode === mode &&
        currentPlayers < room.maxPlayers &&
        room.matchState.status !== 'ended'
      ) {
        const joinResult = this.joinRoom(room.id, playerId, { nickname: options.nickname });
        if (joinResult.success && joinResult.room && joinResult.player) {
          return { room: joinResult.room, player: joinResult.player, isNewRoom: false };
        }
      }
    }

    // If no room found, create one
    const createResult = this.createRoom(playerId, {
      nickname: options.nickname,
      mode,
    });
    return { room: createResult.room, player: createResult.player, isNewRoom: true };
  }

  /**
   * Handle player leaving or disconnecting.
   * Performs host migration or cleanup if room becomes empty.
   */
  public leaveRoom(playerId: string): {
    roomCode?: string;
    roomDestroyed: boolean;
    newHostId?: string;
    leftPlayer?: PlayerState;
  } {
    const roomCode = this.playerToRoom.get(playerId);
    if (!roomCode) {
      return { roomDestroyed: false };
    }

    this.playerToRoom.delete(playerId);
    const room = this.rooms.get(roomCode);
    if (!room) {
      return { roomCode, roomDestroyed: true };
    }

    const leftPlayer = room.players[playerId];
    delete room.players[playerId];

    const remainingPlayerIds = Object.keys(room.players);
    if (remainingPlayerIds.length === 0) {
      // Room is empty, destroy it
      this.rooms.delete(roomCode);
      return { roomCode, roomDestroyed: true, leftPlayer };
    }

    // Host migration if host left
    let newHostId: string | undefined;
    if (room.hostId === playerId) {
      newHostId = remainingPlayerIds[0];
      room.hostId = newHostId;
    }

    return { roomCode, roomDestroyed: false, newHostId, leftPlayer };
  }

  public getRoom(roomCode: string): Room | undefined {
    return this.rooms.get(roomCode.trim().toUpperCase());
  }

  public getRoomByPlayerId(playerId: string): Room | undefined {
    const roomCode = this.playerToRoom.get(playerId);
    return roomCode ? this.rooms.get(roomCode) : undefined;
  }

  public getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }
}
