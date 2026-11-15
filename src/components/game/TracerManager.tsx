import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export interface ActiveTracer {
  id: string;
  start: THREE.Vector3;
  end: THREE.Vector3;
  currentPos: THREE.Vector3;
  direction: THREE.Vector3;
  totalDistance: number;
  traveledDistance: number;
  speed: number;
  color: THREE.Color;
  length: number;
  done: boolean;
}

export interface ActiveShell {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  angularVelocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
}

export interface ActiveSpark {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  lifetime: number;
  maxLifetime: number;
}

// Global Event bus for triggering FX from ViewModel or network hit events
type TracerListener = (tracer: ActiveTracer) => void;
type ShellListener = (shell: ActiveShell) => void;
type SparkListener = (sparks: ActiveSpark[]) => void;

class FXManager {
  private tracerListeners: Set<TracerListener> = new Set();
  private shellListeners: Set<ShellListener> = new Set();
  private sparkListeners: Set<SparkListener> = new Set();

  public onTracer(fn: TracerListener) {
    this.tracerListeners.add(fn);
    return () => this.tracerListeners.delete(fn);
  }

  public onShell(fn: ShellListener) {
    this.shellListeners.add(fn);
    return () => this.shellListeners.delete(fn);
  }

  public onSpark(fn: SparkListener) {
    this.sparkListeners.add(fn);
    return () => this.sparkListeners.delete(fn);
  }

  public spawnTracer(
    start: THREE.Vector3,
    end: THREE.Vector3,
    colorHex = '#ffaa33',
    speed = 280,
    length = 1.2
  ) {
    const dir = new THREE.Vector3().subVectors(end, start);
    const dist = dir.length();
    if (dist < 0.001) return;
    dir.normalize();

    const tracer: ActiveTracer = {
      id: Math.random().toString(36).substring(2, 9),
      start: start.clone(),
      end: end.clone(),
      currentPos: start.clone(),
      direction: dir,
      totalDistance: dist,
      traveledDistance: 0,
      speed,
      color: new THREE.Color(colorHex),
      length,
      done: false,
    };

    this.tracerListeners.forEach((fn) => fn(tracer));
  }

  public spawnShell(
    origin: THREE.Vector3,
    ejectionDir: THREE.Vector3,
    initialSpeed = 3.5
  ) {
    const velocity = ejectionDir
      .clone()
      .normalize()
      .multiplyScalar(initialSpeed)
      .add(new THREE.Vector3((Math.random() - 0.5) * 0.8, 1.5 + Math.random() * 0.8, (Math.random() - 0.5) * 0.8));

    const shell: ActiveShell = {
      id: Math.random().toString(36).substring(2, 9),
      position: origin.clone(),
      velocity,
      rotation: new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ),
      angularVelocity: new THREE.Vector3(
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 25,
        (Math.random() - 0.5) * 25
      ),
      lifetime: 0,
      maxLifetime: 3.5, // 3.5 seconds on ground before fading
    };

    this.shellListeners.forEach((fn) => fn(shell));
  }

  public spawnImpactSparks(
    hitPoint: THREE.Vector3,
    normal: THREE.Vector3,
    isHeadshot = false,
    count = 14
  ) {
    const sparks: ActiveSpark[] = [];
    const baseColor = isHeadshot ? new THREE.Color('#ffcc00') : new THREE.Color('#ff8833');

    for (let i = 0; i < count; i++) {
      const spreadDir = normal
        .clone()
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 1.6,
            (Math.random() - 0.5) * 1.6,
            (Math.random() - 0.5) * 1.6
          )
        )
        .normalize();

      const speed = 4.0 + Math.random() * 7.0;
      sparks.push({
        id: Math.random().toString(36).substring(2, 9),
        position: hitPoint.clone(),
        velocity: spreadDir.multiplyScalar(speed),
        color: baseColor.clone(),
        size: 0.03 + Math.random() * 0.04,
        lifetime: 0,
        maxLifetime: 0.25 + Math.random() * 0.35,
      });
    }

    this.sparkListeners.forEach((fn) => fn(sparks));
  }
}

export const fxManager = new FXManager();

export const TracerManager: React.FC = () => {
  const tracersRef = useRef<ActiveTracer[]>([]);
  const shellsRef = useRef<ActiveShell[]>([]);
  const sparksRef = useRef<ActiveSpark[]>([]);

  // R3F Instanced / Dynamic Meshes
  const tracersGroupRef = useRef<THREE.Group>(null);
  const shellsGroupRef = useRef<THREE.Group>(null);
  const sparksGroupRef = useRef<THREE.Group>(null);

  React.useEffect(() => {
    const unsubTracer = fxManager.onTracer((tracer) => {
      tracersRef.current.push(tracer);
    });
    const unsubShell = fxManager.onShell((shell) => {
      shellsRef.current.push(shell);
    });
    const unsubSpark = fxManager.onSpark((newSparks) => {
      sparksRef.current.push(...newSparks);
    });

    return () => {
      unsubTracer();
      unsubShell();
      unsubSpark();
    };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);

    // 1. Update Bullet Tracers
    for (let i = tracersRef.current.length - 1; i >= 0; i--) {
      const t = tracersRef.current[i];
      const step = t.speed * dt;
      t.traveledDistance += step;
      t.currentPos.addScaledVector(t.direction, step);

      if (t.traveledDistance >= t.totalDistance) {
        tracersRef.current.splice(i, 1);
      }
    }

    // 2. Update Shell Casings with gravity & floor bounce
    const gravity = -16.0;
    for (let i = shellsRef.current.length - 1; i >= 0; i--) {
      const s = shellsRef.current[i];
      s.lifetime += dt;

      if (s.lifetime >= s.maxLifetime) {
        shellsRef.current.splice(i, 1);
        continue;
      }

      // Gravity & Velocity
      s.velocity.y += gravity * dt;
      s.position.addScaledVector(s.velocity, dt);

      // Rotation
      s.rotation.x += s.angularVelocity.x * dt;
      s.rotation.y += s.angularVelocity.y * dt;
      s.rotation.z += s.angularVelocity.z * dt;

      // Floor collision check at y = 0
      if (s.position.y <= 0.02) {
        s.position.y = 0.02;
        s.velocity.y = -s.velocity.y * 0.4; // Bounce restitution
        s.velocity.x *= 0.7; // Friction
        s.velocity.z *= 0.7;
        s.angularVelocity.multiplyScalar(0.6);
      }
    }

    // 3. Update Impact Sparks
    for (let i = sparksRef.current.length - 1; i >= 0; i--) {
      const p = sparksRef.current[i];
      p.lifetime += dt;

      if (p.lifetime >= p.maxLifetime) {
        sparksRef.current.splice(i, 1);
        continue;
      }

      p.velocity.y += -12.0 * dt;
      p.position.addScaledVector(p.velocity, dt);
    }
  });

  return (
    <group>
      {/* 3D Tracers Container */}
      <group ref={tracersGroupRef}>
        {tracersRef.current.map((t) => {
          const lookAtTarget = t.currentPos.clone().add(t.direction);
          return (
            <group key={t.id} position={t.currentPos}>
              {/* Point tracer in direction of motion */}
              <mesh
                rotation={[0, 0, 0]}
                ref={(node) => {
                  if (node) {
                    node.lookAt(lookAtTarget);
                  }
                }}
              >
                {/* Elongated cylinder bullet tracer */}
                <cylinderGeometry args={[0.012, 0.004, t.length, 6]} />
                <meshBasicMaterial
                  color={t.color}
                  transparent
                  opacity={0.9}
                  depthWrite={false}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Brass Shell Casings Container */}
      <group ref={shellsGroupRef}>
        {shellsRef.current.map((s) => (
          <mesh
            key={s.id}
            position={s.position}
            rotation={s.rotation}
            castShadow
          >
            <cylinderGeometry args={[0.007, 0.007, 0.026, 8]} />
            <meshStandardMaterial
              color="#d4af37"
              metalness={0.95}
              roughness={0.2}
            />
          </mesh>
        ))}
      </group>

      {/* Impact Sparks Container */}
      <group ref={sparksGroupRef}>
        {sparksRef.current.map((p) => {
          const alpha = 1 - p.lifetime / p.maxLifetime;
          return (
            <mesh key={p.id} position={p.position}>
              <sphereGeometry args={[p.size * alpha, 4, 4]} />
              <meshBasicMaterial
                color={p.color}
                transparent
                opacity={alpha}
                depthWrite={false}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};
