import {
  HitboxType,
  HitEvent,
  KillfeedEntry,
  PlayerHitPayload,
  PlayerState,
  Room,
  Team,
  Vector3D,
  WEAPON_CONFIGS,
  WeaponConfig,
} from '../shared/types';
import { RoomManager } from './RoomManager';

export interface HitResult {
  valid: boolean;
  reason?: string;
  hitEvent?: HitEvent;
  isKill?: boolean;
  killfeedEntry?: KillfeedEntry;
  respawnAt?: number;
  matchEnded?: boolean;
  winnerTeam?: Team | null;
}

export class CombatEngine {
  public static readonly RESPAWN_DELAY_MS = 3000; // 3 seconds respawn timer
  public static readonly HEADSHOT_MULTIPLIER = 2.5;
  public static readonly LIMB_MULTIPLIER = 0.8;
  public static readonly ARMOR_ABSORPTION_RATE = 0.65; // Armor absorbs 65% of damage
  public static readonly MAX_RAYCAST_BUFFER = 6.0; // Distance tolerance in units for latency buffer

  private roomManager: RoomManager;

  constructor(roomManager: RoomManager) {
    this.roomManager = roomManager;
  }

  /**
   * Euclidean distance between two 3D vectors
   */
  public getDistance(a: Vector3D, b: Vector3D): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Authoritative hit validation and damage calculation.
   */
  public processHit(
    room: Room,
    shooterId: string,
    payload: PlayerHitPayload
  ): HitResult {
    const shooter = room.players[shooterId];
    const target = room.players[payload.targetId];

    // 1. Basic validation: players exist and alive
    if (!shooter) {
      return { valid: false, reason: 'Shooter does not exist' };
    }
    if (shooter.isDead) {
      return { valid: false, reason: 'Dead players cannot deal damage' };
    }
    if (!target) {
      return { valid: false, reason: 'Target player not found' };
    }
    if (target.isDead) {
      return { valid: false, reason: 'Target is already dead' };
    }
    if (shooter.id === target.id) {
      return { valid: false, reason: 'Self-inflicted damage rejected' };
    }

    // 2. Friendly fire check
    if (room.mode === 'TDM' && shooter.team === target.team) {
      return { valid: false, reason: 'Friendly fire is disabled in TDM' };
    }

    // 3. Weapon configuration check
    const weaponConfig: WeaponConfig =
      WEAPON_CONFIGS[payload.weaponId] || WEAPON_CONFIGS[shooter.currentWeapon];
    if (!weaponConfig) {
      return { valid: false, reason: 'Unknown weapon configuration' };
    }

    // 4. Raycast distance check (server authoritative distance)
    const shooterToTargetDist = this.getDistance(shooter.position, target.position);
    if (shooterToTargetDist > weaponConfig.range + CombatEngine.MAX_RAYCAST_BUFFER) {
      return {
        valid: false,
        reason: `Target out of range (${shooterToTargetDist.toFixed(1)}m > ${weaponConfig.range}m)`,
      };
    }

    // 5. Server-authoritative hitbox determination & headshot validation
    const hitHeightRel = payload.hitPosition.y - target.position.y;
    let validatedHitbox: HitboxType = payload.hitbox;

    // Check hit height relative to player base:
    // Standing player is ~1.85 units tall
    // Head: 1.35m - 2.05m
    // Body: 0.65m - 1.35m
    // Limbs: 0.0m - 0.65m
    if (hitHeightRel >= 1.3) {
      validatedHitbox = 'head';
    } else if (hitHeightRel < 0.6) {
      validatedHitbox = 'limb';
    } else {
      validatedHitbox = 'body';
    }

    const isHeadshot = validatedHitbox === 'head';

    // 6. Multipliers and damage computation
    let multiplier = 1.0;
    if (isHeadshot) {
      multiplier = weaponConfig.headshotMultiplier || CombatEngine.HEADSHOT_MULTIPLIER;
    } else if (validatedHitbox === 'limb') {
      multiplier = CombatEngine.LIMB_MULTIPLIER;
    }

    const rawDamage = Math.round(weaponConfig.damage * multiplier);

    // 7. Armor deduction & Health damage calculation
    let absorbedDamage = 0;
    let healthDamage = rawDamage;

    if (target.armor > 0) {
      // Armor absorbs 65% of the hit
      const maxAbsorbable = Math.round(rawDamage * CombatEngine.ARMOR_ABSORPTION_RATE);
      absorbedDamage = Math.min(target.armor, maxAbsorbable);
      target.armor = Math.max(0, target.armor - absorbedDamage);
      healthDamage = rawDamage - absorbedDamage;
    }

    target.health = Math.max(0, target.health - healthDamage);
    const isKill = target.health <= 0;

    // Construct HitEvent
    const hitEvent: HitEvent = {
      id: `${Date.now()}_${shooter.id}_${target.id}`,
      shooterId: shooter.id,
      targetId: target.id,
      weaponId: weaponConfig.id,
      hitbox: validatedHitbox,
      damage: rawDamage,
      absorbedDamage,
      healthDamage,
      hitPosition: { ...payload.hitPosition },
      isKill,
      isHeadshot,
      timestamp: Date.now(),
    };

    let killfeedEntry: KillfeedEntry | undefined;
    let respawnAt: number | undefined;
    let matchEnded = false;
    let winnerTeam: Team | null = null;

    // 8. On Kill handling
    if (isKill) {
      target.isDead = true;
      target.health = 0;
      target.armor = 0;
      target.deaths += 1;

      shooter.kills += 1;
      shooter.score += isHeadshot ? 150 : 100;

      // Update TDM team scores
      if (room.mode === 'TDM') {
        if (shooter.team === 'ALPHA') {
          room.matchState.scoreAlpha += 1;
        } else if (shooter.team === 'BRAVO') {
          room.matchState.scoreBravo += 1;
        }
      }

      // Check match end conditions
      if (room.mode === 'TDM') {
        if (room.matchState.scoreAlpha >= room.matchState.targetScore) {
          matchEnded = true;
          winnerTeam = 'ALPHA';
          room.matchState.status = 'ended';
          room.matchState.winnerTeam = 'ALPHA';
        } else if (room.matchState.scoreBravo >= room.matchState.targetScore) {
          matchEnded = true;
          winnerTeam = 'BRAVO';
          room.matchState.status = 'ended';
          room.matchState.winnerTeam = 'BRAVO';
        }
      } else if (room.mode === 'FFA') {
        if (shooter.kills >= room.matchState.targetScore) {
          matchEnded = true;
          winnerTeam = 'FFA';
          room.matchState.status = 'ended';
          room.matchState.winnerTeam = 'FFA';
        }
      }

      // Build killfeed entry
      killfeedEntry = {
        id: `kf_${Date.now()}_${shooter.id}`,
        killerId: shooter.id,
        killerName: shooter.nickname,
        killerTeam: shooter.team,
        victimId: target.id,
        victimName: target.nickname,
        victimTeam: target.team,
        weaponId: weaponConfig.id,
        isHeadshot,
        timestamp: Date.now(),
      };

      // Set 3-second respawn timer
      respawnAt = Date.now() + CombatEngine.RESPAWN_DELAY_MS;
      target.respawnAt = respawnAt;
    }

    return {
      valid: true,
      hitEvent,
      isKill,
      killfeedEntry,
      respawnAt,
      matchEnded,
      winnerTeam,
    };
  }

  /**
   * Respawns a player after the 3-second respawn timer expires.
   */
  public respawnPlayer(
    room: Room,
    playerId: string
  ): {
    playerId: string;
    position: Vector3D;
    rotation: { x: number; y: number; z: number };
    health: number;
    armor: number;
  } | null {
    const player = room.players[playerId];
    if (!player) return null;

    const spawnPoint = this.roomManager.getOptimalSpawnPoint(room, player.team, playerId);
    const yaw = player.team === 'BRAVO' ? Math.PI : 0;

    player.isDead = false;
    player.health = 100;
    player.armor = 100;
    player.position = { ...spawnPoint };
    player.rotation = { x: 0, y: yaw, z: 0 };
    player.velocity = { x: 0, y: 0, z: 0 };
    delete player.respawnAt;

    // Replenish ammo for current weapon
    const weaponConfig = WEAPON_CONFIGS[player.currentWeapon] || WEAPON_CONFIGS['AR-76'];
    player.ammo = {
      current: weaponConfig.maxAmmo,
      reserve: weaponConfig.reserveAmmo,
    };

    return {
      playerId: player.id,
      position: player.position,
      rotation: player.rotation,
      health: player.health,
      armor: player.armor,
    };
  }
}
