import { Server } from 'socket.io';
import {
  ClientToServerEvents,
  InterServerEvents,
  PlayerInputPayload,
  Room,
  ServerStateSnapshot,
  ServerToClientEvents,
  SocketData,
} from '../shared/types';
import { CombatEngine } from './CombatEngine';
import { RoomManager } from './RoomManager';

export class GameLoop {
  public static readonly TICK_RATE = 60; // 60Hz tick-rate
  public static readonly TICK_INTERVAL_MS = 1000 / GameLoop.TICK_RATE; // ~16.67ms

  private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
  private roomManager: RoomManager;
  private combatEngine: CombatEngine;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private lastTickTime = Date.now();
  private secondAccumulator = 0;

  constructor(
    io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
    roomManager: RoomManager,
    combatEngine: CombatEngine
  ) {
    this.io = io;
    this.roomManager = roomManager;
    this.combatEngine = combatEngine;
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTickTime = Date.now();

    // High frequency tick loop
    this.intervalId = setInterval(() => {
      this.tick();
    }, GameLoop.TICK_INTERVAL_MS);

    console.log(`[GameLoop] 60Hz Engine Tick Loop initialized (${GameLoop.TICK_INTERVAL_MS.toFixed(2)}ms per tick)`);
  }

  public stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    console.log('[GameLoop] Tick loop stopped.');
  }

  /**
   * Main 60Hz tick step
   */
  private tick(): void {
    const now = Date.now();
    const dtMs = now - this.lastTickTime;
    this.lastTickTime = now;

    // Track 1-second interval for match timer countdown
    this.secondAccumulator += dtMs;
    const shouldTickSecond = this.secondAccumulator >= 1000;
    if (shouldTickSecond) {
      this.secondAccumulator -= 1000;
    }

    const rooms = this.roomManager.getAllRooms();

    for (const room of rooms) {
      const playerList = Object.values(room.players);
      if (playerList.length === 0) continue;

      // 1. Check Match Timer Countdown
      if (shouldTickSecond && room.matchState.status === 'in_progress') {
        room.matchState.timeRemaining = Math.max(0, room.matchState.timeRemaining - 1);

        if (room.matchState.timeRemaining <= 0) {
          this.endMatch(room);
        }
      }

      // 2. Check Respawn Timers
      for (const player of playerList) {
        if (player.isDead && player.respawnAt && now >= player.respawnAt) {
          const respawnData = this.combatEngine.respawnPlayer(room, player.id);
          if (respawnData) {
            this.io.to(room.id).emit('game:playerRespawn', respawnData);
          }
        }
      }

      // 3. Broadcast 60Hz State Snapshot to all players in the room
      const snapshot: ServerStateSnapshot = {
        timestamp: now,
        players: playerList,
        matchState: room.matchState,
      };

      this.io.to(room.id).emit('game:stateUpdate', snapshot);
    }
  }

  /**
   * Process client movement input update (authoritative position & rotation reconciliation)
   */
  public handlePlayerInput(playerId: string, payload: PlayerInputPayload): void {
    const room = this.roomManager.getRoomByPlayerId(playerId);
    if (!room) return;

    const player = room.players[playerId];
    if (!player || player.isDead) return;

    // Update player kinematic and animation states
    player.position = { ...payload.position };
    player.rotation = { ...payload.rotation };
    player.velocity = { ...payload.velocity };
    player.isCrouching = payload.isCrouching;
    player.isSprinting = payload.isSprinting;
    player.isAiming = payload.isAiming;
    player.lastProcessedInput = payload.sequenceNumber;
  }

  /**
   * End match when time or score limit is reached
   */
  private endMatch(room: Room): void {
    room.matchState.status = 'ended';

    let winnerTeam = null;
    if (room.mode === 'TDM') {
      if (room.matchState.scoreAlpha > room.matchState.scoreBravo) {
        winnerTeam = 'ALPHA' as const;
      } else if (room.matchState.scoreBravo > room.matchState.scoreAlpha) {
        winnerTeam = 'BRAVO' as const;
      }
    } else {
      // FFA: winner is player with highest kills
      const players = Object.values(room.players);
      players.sort((a, b) => b.kills - a.kills);
      winnerTeam = 'FFA' as const;
    }

    room.matchState.winnerTeam = winnerTeam;

    this.io.to(room.id).emit('game:matchEnd', {
      winnerTeam,
      scoreAlpha: room.matchState.scoreAlpha,
      scoreBravo: room.matchState.scoreBravo,
    });

    console.log(`[GameLoop] Match ended in room ${room.id}. Winner: ${winnerTeam}`);
  }
}
