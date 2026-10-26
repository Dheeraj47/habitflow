import * as THREE from 'three';
import { createSparkleTexture } from '../../../utils/proceduralTextures';

/**
 * Atmospheric magical particle system:
 * - Floating spirit motes / fireflies hovering gently around the sanctuary
 * - Burst of golden & violet stardust on habit completion
 */

export interface ParticleSystem {
  group: THREE.Group;
  updateAnimation: (delta: number, time: number, stage: number) => void;
  triggerBurst: () => void;
}

export function buildParticleSystem(): ParticleSystem {
  const group = new THREE.Group();
  group.name = 'particleSystem';

  const particleCount = 180;
  const geo = new THREE.BufferGeometry();

  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);
  const velocities: { x: number; y: number; z: number; phase: number }[] = [];

  const sparkleTex = createSparkleTexture();

  for (let i = 0; i < particleCount; i++) {
    // Distribute around the island
    const radius = 1.0 + Math.random() * 5.5;
    const angle = Math.random() * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const y = -2.5 + Math.random() * 6.0;
    const z = Math.sin(angle) * radius;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    // Palette: golden saffron, cyan bioluminescence, violet crystal stardust
    const colorType = Math.random();
    if (colorType < 0.45) {
      // Golden firefly
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.88;
      colors[i * 3 + 2] = 0.45;
    } else if (colorType < 0.75) {
      // Cyan bioluminescence
      colors[i * 3] = 0.3;
      colors[i * 3 + 1] = 0.95;
      colors[i * 3 + 2] = 1.0;
    } else {
      // Violet amethyst
      colors[i * 3] = 0.85;
      colors[i * 3 + 1] = 0.55;
      colors[i * 3 + 2] = 1.0;
    }

    sizes[i] = 12 + Math.random() * 20;

    velocities.push({
      x: (Math.random() - 0.5) * 0.15,
      y: 0.15 + Math.random() * 0.35,
      z: (Math.random() - 0.5) * 0.15,
      phase: Math.random() * Math.PI * 2,
    });
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const mat = new THREE.PointsMaterial({
    size: 0.22,
    map: sparkleTex,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const points = new THREE.Points(geo, mat);
  group.add(points);

  // -------------------------------------------------------------
  // Burst particle system for completion celebration
  // -------------------------------------------------------------
  const burstCount = 120;
  const burstGeo = new THREE.BufferGeometry();
  const burstPositions = new Float32Array(burstCount * 3);
  const burstColors = new Float32Array(burstCount * 3);
  const burstVelocities: THREE.Vector3[] = [];

  for (let i = 0; i < burstCount; i++) {
    burstPositions[i * 3] = 0;
    burstPositions[i * 3 + 1] = 0;
    burstPositions[i * 3 + 2] = 0;

    burstColors[i * 3] = 1.0;
    burstColors[i * 3 + 1] = Math.random() > 0.5 ? 0.9 : 0.4;
    burstColors[i * 3 + 2] = Math.random() > 0.5 ? 0.3 : 1.0;

    burstVelocities.push(
      new THREE.Vector3(
        (Math.random() - 0.5) * 4.5,
        1.5 + Math.random() * 4.0,
        (Math.random() - 0.5) * 4.5
      )
    );
  }

  burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));
  burstGeo.setAttribute('color', new THREE.BufferAttribute(burstColors, 3));

  const burstMat = new THREE.PointsMaterial({
    size: 0.35,
    map: sparkleTex,
    vertexColors: true,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const burstPoints = new THREE.Points(burstGeo, burstMat);
  burstPoints.position.set(0, 0.5, 0);
  group.add(burstPoints);

  let burstActive = false;
  let burstTime = 0;

  const triggerBurst = () => {
    burstActive = true;
    burstTime = 0;
    burstMat.opacity = 1.0;
    const pos = burstGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < burstCount; i++) {
      pos.setXYZ(i, (Math.random() - 0.5) * 0.6, 0.2 + Math.random() * 0.4, (Math.random() - 0.5) * 0.6);
    }
    pos.needsUpdate = true;
  };

  const updateAnimation = (delta: number, time: number, stage: number) => {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    // Stage controls how many particles are visible
    const activeThreshold = Math.min(particleCount, 30 + stage * 30);

    for (let i = 0; i < particleCount; i++) {
      if (i > activeThreshold) continue;

      let y = pos.getY(i) + velocities[i].y * delta;
      let x = pos.getX(i) + Math.sin(time + velocities[i].phase) * 0.006;
      let z = pos.getZ(i) + Math.cos(time + velocities[i].phase) * 0.006;

      // Wrap around
      if (y > 4.5) {
        y = -2.8;
      }
      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;

    // Burst logic
    if (burstActive) {
      burstTime += delta;
      const bPos = burstGeo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < burstCount; i++) {
        const vel = burstVelocities[i];
        bPos.setXYZ(
          i,
          bPos.getX(i) + vel.x * delta,
          bPos.getY(i) + vel.y * delta - 0.5 * delta * delta, // gravity
          bPos.getZ(i) + vel.z * delta
        );
      }
      bPos.needsUpdate = true;
      burstMat.opacity = Math.max(0, 1.0 - burstTime / 2.5);

      if (burstTime > 2.5) {
        burstActive = false;
      }
    }
  };

  return {
    group,
    updateAnimation,
    triggerBurst,
  };
}
