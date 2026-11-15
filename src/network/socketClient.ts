import { io, Socket } from 'socket.io-client';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  CreateRoomPayload,
  JoinRoomPayload,
  QuickMatchPayload,
  PlayerInputPayload,
  PlayerFirePayload,
  PlayerHitPayload,
  WeaponId,
  BulletData,
  HitEvent,
} from '@/types/game';
import { useGameStore } from '@/store/gameStore';

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketClient {
  private socket: TypedSocket | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private fireListeners: Array<(bullet: BulletData) => void> = [];
  private hitListeners: Array<(hit: HitEvent) => void> = [];

  public connect(customUrl?: string): TypedSocket {
    if (this.socket && this.socket.connected) {
      return this.socket;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    let serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tactical_fps_socket_url');
      if (customUrl) {
        serverUrl = customUrl;
        localStorage.setItem('tactical_fps_socket_url', customUrl);
      } else if (stored) {
        serverUrl = stored;
      } else if (process.env.NEXT_PUBLIC_SOCKET_URL) {
        serverUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
      } else {
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocal) {
          serverUrl = 'http://localhost:3001';
        } else {
          serverUrl = 'http://localhost:3001';
        }
      }
    }

    useGameStore.getState().setConnecting(true);

    this.socket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 2,
      reconnectionDelay: 1000,
      timeout: 3000,
    }) as TypedSocket;

    this.setupListeners();
    this.startPingLoop();

    return this.socket;
  }

  public getSocket(): TypedSocket | null {
    return this.socket;
  }

  public isConnected(): boolean {
    return !!(this.socket && this.socket.connected);
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server ID:', this.socket?.id);
      useGameStore.getState().setConnecting(false, null);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      useGameStore.getState().setConnecting(false, 'Disconnected from server');
    });

    this.socket.on('connect_error', (error) => {
      console.warn('[Socket] Connection error:', error.message);
      useGameStore.getState().setConnecting(
        false,
        `Sunucu Çevrimdışı (${error.message}). İster Çevrimdışı Bot Arenası'nda hemen oynayabilir, ister özel sunucu adresi bağlayabilirsiniz.`
      );
    });

    // Room Events
    this.socket.on('room:joined', ({ room, playerId }) => {
      console.log('[Socket] Room joined:', room.id, 'Player:', playerId);
      useGameStore.getState().setRoomJoined(room, playerId);
    });

    this.socket.on('room:error', ({ message }) => {
      console.error('[Socket] Room error:', message);
      useGameStore.getState().setConnecting(false, message);
    });

    this.socket.on('room:playerJoined', ({ player }) => {
      useGameStore.getState().addPlayer(player);
    });

    this.socket.on('room:playerLeft', ({ playerId }) => {
      useGameStore.getState().removePlayer(playerId);
    });

    // Game Loop Snapshot
    this.socket.on('game:stateUpdate', (snapshot) => {
      useGameStore.getState().syncServerSnapshot(snapshot.players, snapshot.matchState);
    });

    // Combat Events
    this.socket.on('game:playerFired', (bullet) => {
      for (const listener of this.fireListeners) {
        listener(bullet);
      }
    });

    this.socket.on('game:playerHit', (hit) => {
      const store = useGameStore.getState();
      const localId = store.playerId;

      // Notify hit listeners (e.g. for audio/tracers)
      for (const listener of this.hitListeners) {
        listener(hit);
      }

      // If we are the shooter, show hitmarker
      if (hit.shooterId === localId) {
        if (hit.isKill) {
          store.addHitmarker('kill');
        } else if (hit.isHeadshot) {
          store.addHitmarker('headshot');
        } else {
          store.addHitmarker('body');
        }
      }

      // If we are the victim, take damage feedback
      if (hit.targetId === localId) {
        // Calculate incoming angle relative to local orientation
        let angleDeg = 0;
        const localPos = store.position;
        const localYaw = store.rotation.y;
        if (hit.hitPosition) {
          const dx = hit.hitPosition.x - localPos.x;
          const dz = hit.hitPosition.z - localPos.z;
          const worldAngle = Math.atan2(dx, dz); // radians
          const relAngle = worldAngle - localYaw;
          angleDeg = ((relAngle * 180) / Math.PI + 360) % 360;
        }
        store.takeDamage(hit.damage, angleDeg);
      }
    });

    this.socket.on('game:playerDied', ({ victimId, killerId, killfeed, respawnAt }) => {
      const store = useGameStore.getState();
      store.addKillfeedEntry(killfeed);

      if (victimId === store.playerId) {
        store.triggerDeath(respawnAt);
      }
    });

    this.socket.on('game:playerRespawn', ({ playerId, position, rotation, health, armor }) => {
      const store = useGameStore.getState();
      if (playerId === store.playerId) {
        store.triggerRespawn(position, rotation);
      }
    });

    this.socket.on('game:killfeed', (entry) => {
      useGameStore.getState().addKillfeedEntry(entry);
    });

    this.socket.on('game:matchEnd', ({ winnerTeam, scoreAlpha, scoreBravo }) => {
      useGameStore.getState().updateMatchState({
        status: 'ended',
        winnerTeam,
        scoreAlpha,
        scoreBravo,
      });
    });

    // Latency Ping-Pong
    this.socket.on('pong:latency', ({ clientTimestamp }) => {
      const rtt = Math.max(1, Date.now() - clientTimestamp);
      useGameStore.getState().setPing(Math.round(rtt));
    });
  }

  private startPingLoop(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.connected) {
        this.socket.emit('ping:latency', { timestamp: Date.now() });
      }
    }, 2000);
  }

  // Room Actions
  public createRoom(payload: CreateRoomPayload): void {
    const s = this.ensureConnected();
    s.emit('room:create', payload);
  }

  public joinRoom(payload: JoinRoomPayload): void {
    const s = this.ensureConnected();
    s.emit('room:join', payload);
  }

  public quickMatch(payload: QuickMatchPayload): void {
    const s = this.ensureConnected();
    s.emit('room:quickMatch', payload);
  }

  public leaveRoom(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('room:leave');
    }
    useGameStore.getState().leaveRoom();
  }

  // Gameplay Events
  public sendInput(payload: PlayerInputPayload): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('player:input', payload);
    }
  }

  public sendFire(payload: PlayerFirePayload): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('player:fire', payload);
    }
  }

  public sendHit(payload: PlayerHitPayload): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('player:hit', payload);
    }
  }

  public sendReload(): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('player:reload');
    }
  }

  public sendSwitchWeapon(weaponId: WeaponId): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('player:switchWeapon', { weaponId });
    }
  }

  // Combat Event Subscriptions
  public onPlayerFired(callback: (bullet: BulletData) => void): () => void {
    this.fireListeners.push(callback);
    return () => {
      this.fireListeners = this.fireListeners.filter((cb) => cb !== callback);
    };
  }

  public onPlayerHit(callback: (hit: HitEvent) => void): () => void {
    this.hitListeners.push(callback);
    return () => {
      this.hitListeners = this.hitListeners.filter((cb) => cb !== callback);
    };
  }

  private ensureConnected(): TypedSocket {
    if (!this.socket || !this.socket.connected) {
      return this.connect();
    }
    return this.socket;
  }

  public disconnect(): void {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketClient = new SocketClient();
