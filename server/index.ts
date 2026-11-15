import http from 'http';
import { Server } from 'socket.io';
import {
  BulletData,
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData,
  WEAPON_CONFIGS,
} from '../shared/types';
import { CombatEngine } from './CombatEngine';
import { GameLoop } from './GameLoop';
import { RoomManager } from './RoomManager';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// 1. Create HTTP server with healthcheck and basic CORS headers
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'online',
        service: 'Tactical-FPS-Server',
        tickRate: GameLoop.TICK_RATE,
        activeRooms: roomManager.getAllRooms().length,
        timestamp: Date.now(),
      })
    );
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

// 2. Initialize Socket.io Server with Port 3000 CORS support
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
  server,
  {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        '*',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  }
);

// 3. Initialize Core Subsystems
const roomManager = new RoomManager();
const combatEngine = new CombatEngine(roomManager);
const gameLoop = new GameLoop(io, roomManager, combatEngine);

// 4. Register Socket Event Handlers
io.on('connection', (socket) => {
  socket.data.playerId = socket.id;

  // Ping / Latency measuring
  socket.on('ping:latency', (payload) => {
    socket.emit('pong:latency', {
      clientTimestamp: payload.timestamp,
      serverTimestamp: Date.now(),
    });

    // Update player ping in room state if room exists
    const room = roomManager.getRoomByPlayerId(socket.id);
    if (room && room.players[socket.id]) {
      const rtt = Date.now() - payload.timestamp;
      room.players[socket.id].ping = Math.max(1, Math.round(rtt / 2));
    }
  });

  // Room Creation
  socket.on('room:create', (payload) => {
    try {
      const { room, player } = roomManager.createRoom(socket.id, payload);
      socket.data.roomId = room.id;
      socket.data.nickname = player.nickname;

      socket.join(room.id);
      socket.emit('room:joined', { room, playerId: socket.id });
      socket.to(room.id).emit('room:playerJoined', { player });

      console.log(
        `[RoomManager] Room created: ${room.id} (${room.mode}) by ${player.nickname} (${socket.id})`
      );
    } catch (err: any) {
      socket.emit('room:error', { message: err.message || 'Failed to create room' });
    }
  });

  // Room Join by Code
  socket.on('room:join', (payload) => {
    try {
      const result = roomManager.joinRoom(payload.roomCode, socket.id, payload);
      if (!result.success || !result.room || !result.player) {
        socket.emit('room:error', { message: result.error || 'Failed to join room' });
        return;
      }

      socket.data.roomId = result.room.id;
      socket.data.nickname = result.player.nickname;

      socket.join(result.room.id);
      socket.emit('room:joined', { room: result.room, playerId: socket.id });
      socket.to(result.room.id).emit('room:playerJoined', { player: result.player });

      console.log(
        `[RoomManager] Player ${result.player.nickname} joined room: ${result.room.id} on team ${result.player.team}`
      );
    } catch (err: any) {
      socket.emit('room:error', { message: err.message || 'Error joining room' });
    }
  });

  // Quick Matchmaking
  socket.on('room:quickMatch', (payload) => {
    try {
      const { room, player, isNewRoom } = roomManager.quickMatch(socket.id, payload);
      socket.data.roomId = room.id;
      socket.data.nickname = player.nickname;

      socket.join(room.id);
      socket.emit('room:joined', { room, playerId: socket.id });

      if (isNewRoom) {
        console.log(`[QuickMatch] Created new room ${room.id} for ${player.nickname}`);
      } else {
        socket.to(room.id).emit('room:playerJoined', { player });
        console.log(`[QuickMatch] Matched ${player.nickname} into existing room ${room.id}`);
      }
    } catch (err: any) {
      socket.emit('room:error', { message: err.message || 'Quick match failed' });
    }
  });

  // Explicit Leave Room
  socket.on('room:leave', () => {
    handlePlayerLeave(socket.id);
  });

  // Player Movement & Input Update
  socket.on('player:input', (payload) => {
    gameLoop.handlePlayerInput(socket.id, payload);
  });

  // Player Fire Weapon
  socket.on('player:fire', (payload) => {
    const room = roomManager.getRoomByPlayerId(socket.id);
    if (!room) return;

    const player = room.players[socket.id];
    if (!player || player.isDead) return;

    const weapon = WEAPON_CONFIGS[payload.weaponId] || WEAPON_CONFIGS[player.currentWeapon];
    if (!weapon) return;

    // Melee weapons have 0 maxAmmo and infinite swings
    if (weapon.category !== 'melee') {
      if (player.ammo.current <= 0) {
        return; // Empty magazine
      }
      player.ammo.current = Math.max(0, player.ammo.current - 1);
    }

    const bullet: BulletData = {
      id: `b_${Date.now()}_${socket.id}_${Math.random().toString(36).substring(2, 7)}`,
      shooterId: socket.id,
      weaponId: weapon.id,
      origin: payload.origin,
      direction: payload.direction,
      timestamp: payload.timestamp || Date.now(),
      speed: weapon.bulletSpeed,
    };

    // Broadcast projectile fire to other clients in the room for visual tracers and audio
    socket.to(room.id).emit('game:playerFired', bullet);
  });

  // Player Reload Weapon
  socket.on('player:reload', () => {
    const room = roomManager.getRoomByPlayerId(socket.id);
    if (!room) return;

    const player = room.players[socket.id];
    if (!player || player.isDead) return;

    const weapon = WEAPON_CONFIGS[player.currentWeapon];
    if (!weapon || weapon.category === 'melee') return;

    const needed = weapon.maxAmmo - player.ammo.current;
    if (needed <= 0 || player.ammo.reserve <= 0) return;

    const reloadAmount = Math.min(needed, player.ammo.reserve);
    player.ammo.current += reloadAmount;
    player.ammo.reserve -= reloadAmount;
  });

  // Switch Weapon
  socket.on('player:switchWeapon', ({ weaponId }) => {
    const room = roomManager.getRoomByPlayerId(socket.id);
    if (!room) return;

    const player = room.players[socket.id];
    if (!player || player.isDead) return;

    const weapon = WEAPON_CONFIGS[weaponId];
    if (!weapon) return;

    player.currentWeapon = weaponId;
    player.ammo = {
      current: weapon.maxAmmo,
      reserve: weapon.reserveAmmo,
    };
  });

  // Server-Authoritative Hit Validation
  socket.on('player:hit', (payload) => {
    const room = roomManager.getRoomByPlayerId(socket.id);
    if (!room) return;

    const hitResult = combatEngine.processHit(room, socket.id, payload);
    if (!hitResult.valid || !hitResult.hitEvent) {
      return;
    }

    // Broadcast hit event to all players in the room for hitmarkers, health bar updates, and audio
    io.to(room.id).emit('game:playerHit', hitResult.hitEvent);

    // If hit resulted in elimination
    if (hitResult.isKill && hitResult.killfeedEntry) {
      io.to(room.id).emit('game:killfeed', hitResult.killfeedEntry);
      io.to(room.id).emit('game:playerDied', {
        victimId: hitResult.hitEvent.targetId,
        killerId: hitResult.hitEvent.shooterId,
        killfeed: hitResult.killfeedEntry,
        respawnAt: hitResult.respawnAt || Date.now() + 3000,
      });

      // If match victory was reached
      if (hitResult.matchEnded) {
        io.to(room.id).emit('game:matchEnd', {
          winnerTeam: hitResult.winnerTeam || null,
          scoreAlpha: room.matchState.scoreAlpha,
          scoreBravo: room.matchState.scoreBravo,
        });
      }
    }
  });

  // Disconnection handler
  socket.on('disconnect', () => {
    handlePlayerLeave(socket.id);
  });
});

/**
 * Handle room leave cleanup
 */
function handlePlayerLeave(playerId: string) {
  const result = roomManager.leaveRoom(playerId);
  if (result.roomCode && !result.roomDestroyed) {
    io.to(result.roomCode).emit('room:playerLeft', {
      playerId,
      newHostId: result.newHostId,
    });
    console.log(
      `[RoomManager] Player ${playerId} left room ${result.roomCode}. Host migrated to: ${result.newHostId}`
    );
  }
}

// 5. Start the Server and the 60Hz Game Loop
server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Tactical FPS Multiplayer Server running on port ${PORT}`);
  console.log(`🌐 CORS enabled for http://localhost:3000`);
  console.log(`⚡ 60Hz Server-Authoritative Physics & Combat Active`);
  console.log(`=======================================================`);
  gameLoop.start();
});

// Process signal handling for clean teardown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  gameLoop.stop();
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Terminating server...');
  gameLoop.stop();
  server.close(() => {
    process.exit(0);
  });
});
