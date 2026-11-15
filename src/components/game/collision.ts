// ============================================================================
// OUTPOST-09 ARENA COLLISION, GEOMETRY & PHYSICS ENGINE
// ============================================================================

export interface AABB {
  min: [number, number, number];
  max: [number, number, number];
  tag?: string;
}

export interface Ramp {
  id: string;
  min: [number, number, number]; // [minX, minY, minZ]
  max: [number, number, number]; // [maxX, maxY, maxZ]
  direction: 'posZ' | 'negZ' | 'posX' | 'negX'; // Direction of upward slope
  startY: number;
  endY: number;
}

export interface JumpPadConfig {
  id: string;
  position: [number, number, number];
  radius: number;
  velocity: [number, number, number]; // [vx, vy, vz] impulse
  cooldownMs: number;
}

export interface SpawnPoint {
  id: string;
  team: 'ALPHA' | 'BRAVO' | 'FFA';
  position: [number, number, number];
  yaw: number;
}

// ----------------------------------------------------------------------------
// ARENA COLLIDERS: AABB BOXES
// ----------------------------------------------------------------------------
export const ARENA_COLLIDERS: AABB[] = [
  // --- Perimeter Outer Walls (80m x 80m x 14m) ---
  { min: [-40, 0, -42], max: [40, 14, -38], tag: 'wall_north' },
  { min: [-40, 0, 38], max: [40, 14, 42], tag: 'wall_south' },
  { min: [-42, 0, -40], max: [-38, 14, 40], tag: 'wall_west' },
  { min: [38, 0, -40], max: [42, 14, 40], tag: 'wall_east' },

  // --- Main Ground Floor Floorplate (Ground at Y=0) ---
  { min: [-40, -4, -40], max: [40, 0, 40], tag: 'ground' },

  // --- Central Reactor Trench & Embankments ---
  // Reactor base cylindrical housing collision box
  { min: [-3.5, 0, -3.5], max: [3.5, 1.2, 3.5], tag: 'reactor_core' },

  // --- Central Elevated Hex Platform (Y = 4.0) ---
  { min: [-5, 3.75, -5], max: [5, 4.0, 5], tag: 'center_platform' },

  // --- North Mid-Tier Platform (Y = 4.0) ---
  { min: [-12, 3.75, -20], max: [12, 4.0, -12], tag: 'north_platform' },

  // --- South Mid-Tier Platform (Y = 4.0) ---
  { min: [-12, 3.75, 12], max: [12, 4.0, 20], tag: 'south_platform' },

  // --- West Catwalk (Y = 4.0) ---
  { min: [-28, 3.75, -16], max: [-18, 4.0, 16], tag: 'west_catwalk' },

  // --- East Catwalk (Y = 4.0) ---
  { min: [18, 3.75, -16], max: [28, 4.0, 16], tag: 'east_catwalk' },

  // --- Energy Bridges (Connecting Platforms to Center at Y = 4.0) ---
  { min: [-2.5, 3.8, -12], max: [2.5, 4.0, -5], tag: 'bridge_north' },
  { min: [-2.5, 3.8, 5], max: [2.5, 4.0, 12], tag: 'bridge_south' },
  { min: [-18, 3.8, -2.5], max: [-5, 4.0, 2.5], tag: 'bridge_west' },
  { min: [5, 3.8, -2.5], max: [18, 4.0, 2.5], tag: 'bridge_east' },

  // --- Tower Alpha (North Sniper Tower, Y = 8.0 Deck) ---
  { min: [-7, 0, -38], max: [7, 8.0, -30], tag: 'tower_alpha_base' },
  { min: [-8, 7.8, -39], max: [8, 8.0, -29], tag: 'tower_alpha_deck' },
  // Tower Alpha Railings / Parapets (1.1m high)
  { min: [-8.2, 8.0, -39.2], max: [-7.8, 9.1, -28.8], tag: 'tower_alpha_rail_w' },
  { min: [7.8, 8.0, -39.2], max: [8.2, 9.1, -28.8], tag: 'tower_alpha_rail_e' },
  { min: [-8, 8.0, -29.2], max: [8, 9.1, -28.8], tag: 'tower_alpha_rail_s' },

  // --- Tower Bravo (South Sniper Tower, Y = 8.0 Deck) ---
  { min: [-7, 0, 30], max: [7, 8.0, 38], tag: 'tower_bravo_base' },
  { min: [-8, 7.8, 29], max: [8, 8.0, 39], tag: 'tower_bravo_deck' },
  // Tower Bravo Railings / Parapets (1.1m high)
  { min: [-8.2, 8.0, 28.8], max: [-7.8, 9.1, 39.2], tag: 'tower_bravo_rail_w' },
  { min: [7.8, 8.0, 28.8], max: [8.2, 9.1, 39.2], tag: 'tower_bravo_rail_e' },
  { min: [-8, 8.0, 28.8], max: [8, 9.1, 29.2], tag: 'tower_bravo_rail_n' },

  // --- Massive Structural Support Columns (3m x 3m x 12m) ---
  { min: [-17.5, 0, -17.5], max: [-14.5, 12, -14.5], tag: 'pillar_nw' },
  { min: [14.5, 0, -17.5], max: [17.5, 12, -14.5], tag: 'pillar_ne' },
  { min: [-17.5, 0, 14.5], max: [-14.5, 12, 17.5], tag: 'pillar_sw' },
  { min: [14.5, 0, 14.5], max: [17.5, 12, 17.5], tag: 'pillar_se' },

  // --- Heavy Industrial Shipping Containers (Cover, 6m x 2.5m x 2.6m) ---
  { min: [-31, 0, -25], max: [-25, 2.6, -22], tag: 'container_nw' },
  { min: [-31, 0, 22], max: [-25, 2.6, 25], tag: 'container_sw' },
  { min: [25, 0, -25], max: [31, 2.6, -22], tag: 'container_ne' },
  { min: [25, 0, 22], max: [31, 2.6, 25], tag: 'container_se' },

  // --- Tactical Half-Cover Jersey Barriers & Sandbag Barricades (Height 1.1m) ---
  // Center Courtyard Flank Covers
  { min: [-9, 0, -1.5], max: [-7, 1.15, 1.5], tag: 'cover_center_w' },
  { min: [7, 0, -1.5], max: [9, 1.15, 1.5], tag: 'cover_center_e' },
  { min: [-1.5, 0, -9], max: [1.5, 1.15, -7], tag: 'cover_center_n' },
  { min: [-1.5, 0, 7], max: [1.5, 1.15, 9], tag: 'cover_center_s' },

  // Alpha Base Frontline Bunkers
  { min: [-14, 0, -29], max: [-10, 1.2, -27], tag: 'cover_alpha_w' },
  { min: [10, 0, -29], max: [14, 1.2, -27], tag: 'cover_alpha_e' },

  // Bravo Base Frontline Bunkers
  { min: [-14, 0, 27], max: [-10, 1.2, 29], tag: 'cover_bravo_w' },
  { min: [10, 0, 27], max: [14, 1.2, 29], tag: 'cover_bravo_e' },

  // Mid-Level Railings
  { min: [-5.1, 4.0, -5], max: [-4.9, 4.9, 5], tag: 'center_rail_w' },
  { min: [4.9, 4.0, -5], max: [5.1, 4.9, 5], tag: 'center_rail_e' },
];

// ----------------------------------------------------------------------------
// RAMPS / SLOPES (Smooth 20° Ascents)
// ----------------------------------------------------------------------------
export const ARENA_RAMPS: Ramp[] = [
  // North Ramp (Ground Y=0 to North Platform Y=4)
  // Ascends going South (from z=-27 to z=-20)
  {
    id: 'ramp_north',
    min: [-2.5, 0, -27],
    max: [2.5, 4.0, -20],
    direction: 'posZ', // Going towards posZ increases Y
    startY: 0,
    endY: 4.0,
  },
  // South Ramp (Ground Y=0 to South Platform Y=4)
  // Ascends going North (from z=27 to z=20)
  {
    id: 'ramp_south',
    min: [-2.5, 0, 20],
    max: [2.5, 4.0, 27],
    direction: 'negZ', // Going towards negZ increases Y
    startY: 4.0,
    endY: 0,
  },
  // West Ramp (Ground Y=0 to West Catwalk Y=4)
  // Ascends going East (from x=-32 to x=-28, around z=0)
  {
    id: 'ramp_west',
    min: [-33, 0, -2.5],
    max: [-27, 4.0, 2.5],
    direction: 'posX',
    startY: 0,
    endY: 4.0,
  },
  // East Ramp (Ground Y=0 to East Catwalk Y=4)
  // Ascends going West (from x=33 to x=28, around z=0)
  {
    id: 'ramp_east',
    min: [27, 0, -2.5],
    max: [33, 4.0, 2.5],
    direction: 'negX',
    startY: 4.0,
    endY: 0,
  },
];

// ----------------------------------------------------------------------------
// JUMP PADS (High-Velocity Launch Zones)
// ----------------------------------------------------------------------------
export const ARENA_JUMP_PADS: JumpPadConfig[] = [
  // 1. Alpha Tower Launch Pad (Ground to Tower Alpha Deck Y=8)
  {
    id: 'pad_alpha_tower',
    position: [0, 0.05, -23],
    radius: 1.8,
    velocity: [0, 16.5, -6.5],
    cooldownMs: 800,
  },
  // 2. Bravo Tower Launch Pad (Ground to Tower Bravo Deck Y=8)
  {
    id: 'pad_bravo_tower',
    position: [0, 0.05, 23],
    radius: 1.8,
    velocity: [0, 16.5, 6.5],
    cooldownMs: 800,
  },
  // 3. West Flank Boost Pad (Launches onto West High Catwalk)
  {
    id: 'pad_west_flank',
    position: [-23, 0.05, -8],
    radius: 1.6,
    velocity: [4.0, 13.5, 8.0],
    cooldownMs: 800,
  },
  // 4. East Flank Boost Pad (Launches onto East High Catwalk)
  {
    id: 'pad_east_flank',
    position: [23, 0.05, 8],
    radius: 1.6,
    velocity: [-4.0, 13.5, -8.0],
    cooldownMs: 800,
  },
];

// ----------------------------------------------------------------------------
// SPAWN POINTS
// ----------------------------------------------------------------------------
export const ARENA_SPAWN_POINTS: SpawnPoint[] = [
  // Alpha Team Spawns (North Base)
  { id: 'alpha_1', team: 'ALPHA', position: [-8, 0.1, -33], yaw: 0 },
  { id: 'alpha_2', team: 'ALPHA', position: [0, 0.1, -34], yaw: 0 },
  { id: 'alpha_3', team: 'ALPHA', position: [8, 0.1, -33], yaw: 0 },
  { id: 'alpha_4', team: 'ALPHA', position: [-14, 0.1, -32], yaw: 0.2 },
  { id: 'alpha_5', team: 'ALPHA', position: [14, 0.1, -32], yaw: -0.2 },

  // Bravo Team Spawns (South Base)
  { id: 'bravo_1', team: 'BRAVO', position: [-8, 0.1, 33], yaw: Math.PI },
  { id: 'bravo_2', team: 'BRAVO', position: [0, 0.1, 34], yaw: Math.PI },
  { id: 'bravo_3', team: 'BRAVO', position: [8, 0.1, 33], yaw: Math.PI },
  { id: 'bravo_4', team: 'BRAVO', position: [-14, 0.1, 32], yaw: Math.PI - 0.2 },
  { id: 'bravo_5', team: 'BRAVO', position: [14, 0.1, 32], yaw: Math.PI + 0.2 },

  // FFA Spawns (Distributed tactical positions)
  { id: 'ffa_1', team: 'FFA', position: [-8, 0.1, -33], yaw: 0 },
  { id: 'ffa_2', team: 'FFA', position: [8, 0.1, 33], yaw: Math.PI },
  { id: 'ffa_3', team: 'FFA', position: [-26, 0.1, 0], yaw: Math.PI / 2 },
  { id: 'ffa_4', team: 'FFA', position: [26, 0.1, 0], yaw: -Math.PI / 2 },
  { id: 'ffa_5', team: 'FFA', position: [0, 4.1, 0], yaw: 0 }, // Center high platform
  { id: 'ffa_6', team: 'FFA', position: [-24, 4.1, -10], yaw: 0.8 },
  { id: 'ffa_7', team: 'FFA', position: [24, 4.1, 10], yaw: -2.3 },
  { id: 'ffa_8', team: 'FFA', position: [0, 8.1, -34], yaw: 0 }, // Alpha sniper tower
];

// ----------------------------------------------------------------------------
// COLLISION RESOLUTION FUNCTIONS
// ----------------------------------------------------------------------------

/**
 * Checks if a point is within horizontal bounds of a ramp and returns the exact ramp floor height
 */
export function getRampHeightAt(x: number, z: number): number | null {
  for (const ramp of ARENA_RAMPS) {
    if (x >= ramp.min[0] && x <= ramp.max[0] && z >= ramp.min[2] && z <= ramp.max[2]) {
      let t = 0;
      if (ramp.direction === 'posZ') {
        t = (z - ramp.min[2]) / (ramp.max[2] - ramp.min[2]);
        return ramp.startY + t * (ramp.endY - ramp.startY);
      } else if (ramp.direction === 'negZ') {
        t = (ramp.max[2] - z) / (ramp.max[2] - ramp.min[2]);
        return ramp.startY + t * (ramp.endY - ramp.startY);
      } else if (ramp.direction === 'posX') {
        t = (x - ramp.min[0]) / (ramp.max[0] - ramp.min[0]);
        return ramp.startY + t * (ramp.endY - ramp.startY);
      } else if (ramp.direction === 'negX') {
        t = (ramp.max[0] - x) / (ramp.max[0] - ramp.min[0]);
        return ramp.startY + t * (ramp.endY - ramp.startY);
      }
    }
  }
  return null;
}

/**
 * Resolves player capsule/box collision against arena AABBs and ramps.
 * Returns updated position, velocity, and isGrounded status.
 */
export function resolveCollision(
  currentPos: [number, number, number],
  targetPos: [number, number, number],
  radius: number = 0.45,
  height: number = 1.8
): {
  position: [number, number, number];
  isGrounded: boolean;
  hitCeiling: boolean;
} {
  let [x, y, z] = targetPos;
  let isGrounded = false;
  let hitCeiling = false;

  // 1. First check if on a ramp
  const rampFloor = getRampHeightAt(x, z);
  if (rampFloor !== null) {
    if (y <= rampFloor + 0.15 && y >= rampFloor - 0.5) {
      y = rampFloor;
      isGrounded = true;
    }
  }

  // 2. Check vertical collision with all AABBs (floors & ceilings)
  for (const box of ARENA_COLLIDERS) {
    // Check horizontal overlap with box expanded by player radius
    if (
      x + radius > box.min[0] &&
      x - radius < box.max[0] &&
      z + radius > box.min[2] &&
      z - radius < box.max[2]
    ) {
      // Landing on top of box (Floor)
      const boxTop = box.max[1];
      if (currentPos[1] >= boxTop - 0.25 && y <= boxTop + 0.1) {
        y = boxTop;
        isGrounded = true;
      }
      // Hitting bottom of box with head (Ceiling)
      const boxBottom = box.min[1];
      if (currentPos[1] + height <= boxBottom + 0.1 && y + height >= boxBottom) {
        y = boxBottom - height;
        hitCeiling = true;
      }
    }
  }

  // 3. Fallback to Ground Level Y=0
  if (y <= 0) {
    y = 0;
    isGrounded = true;
  }

  // 4. Horizontal collision resolution (X-axis then Z-axis for clean sliding)
  // Test X movement
  let testX = x;
  for (const box of ARENA_COLLIDERS) {
    // Only test if vertical spans overlap
    if (y + height > box.min[1] && y + 0.2 < box.max[1]) {
      if (
        testX + radius > box.min[0] &&
        testX - radius < box.max[0] &&
        currentPos[2] + radius > box.min[2] &&
        currentPos[2] - radius < box.max[2]
      ) {
        // Resolve along X
        if (currentPos[0] < (box.min[0] + box.max[0]) / 2) {
          testX = box.min[0] - radius;
        } else {
          testX = box.max[0] + radius;
        }
      }
    }
  }
  x = testX;

  // Test Z movement
  let testZ = z;
  for (const box of ARENA_COLLIDERS) {
    if (y + height > box.min[1] && y + 0.2 < box.max[1]) {
      if (
        x + radius > box.min[0] &&
        x - radius < box.max[0] &&
        testZ + radius > box.min[2] &&
        testZ - radius < box.max[2]
      ) {
        // Resolve along Z
        if (currentPos[2] < (box.min[2] + box.max[2]) / 2) {
          testZ = box.min[2] - radius;
        } else {
          testZ = box.max[2] + radius;
        }
      }
    }
  }
  z = testZ;

  // Boundary clamp
  x = Math.max(-38.5, Math.min(38.5, x));
  z = Math.max(-38.5, Math.min(38.5, z));

  return {
    position: [x, y, z],
    isGrounded,
    hitCeiling,
  };
}

/**
 * Checks if player is stepping inside a jump pad's active trigger cylinder
 */
export function checkJumpPads(
  pos: [number, number, number],
  radius: number = 0.5
): JumpPadConfig | null {
  for (const pad of ARENA_JUMP_PADS) {
    const dx = pos[0] - pad.position[0];
    const dz = pos[2] - pad.position[2];
    const distSq = dx * dx + dz * dz;
    const triggerRadius = pad.radius + radius;

    // Check horizontal radius and vertical proximity (within 1.2m of pad height)
    if (distSq <= triggerRadius * triggerRadius && Math.abs(pos[1] - pad.position[1]) < 1.4) {
      return pad;
    }
  }
  return null;
}
