import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Sparkles, Compass, Eye, ShieldCheck, Flame } from 'lucide-react';
import { IslandFallback } from './IslandFallback';

interface HabitIslandCanvasProps {
  completionRate?: number;
  completedCount?: number;
  totalCount?: number;
  pulseTrigger?: number;
  userXP?: number;
  topStreak?: number;
}

function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

// Procedural 2D Texture Generators for Halos & Particle Sprites
function createRadialGlowTexture(innerColor: string, midColor: string, outerColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 4, 128, 128, 128);
    grad.addColorStop(0.0, innerColor);
    grad.addColorStop(0.35, midColor);
    grad.addColorStop(0.7, outerColor);
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createAuraRingTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 250);
    grad.addColorStop(0.0, 'rgba(180, 145, 255, 0.45)');
    grad.addColorStop(0.32, 'rgba(148, 110, 255, 0.28)');
    grad.addColorStop(0.45, 'rgba(110, 80, 210, 0.08)');
    grad.addColorStop(0.56, 'rgba(170, 135, 255, 0.30)');
    grad.addColorStop(0.68, 'rgba(120, 90, 220, 0.06)');
    grad.addColorStop(0.79, 'rgba(165, 130, 255, 0.18)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function pseudoNoise3D(x: number, y: number, z: number): number {
  const n =
    Math.sin(x * 1.7 + y * 2.3) * Math.cos(y * 1.9 + z * 2.1) +
    0.5 * Math.sin(x * 4.1 - z * 3.7 + y * 1.3) +
    0.25 * Math.cos(x * 7.3 + y * 5.9 - z * 6.1);
  return n / 1.75;
}

function createFacetedCrystalGeometry(radius: number, height: number, sides: number): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(radius * 0.58, radius, height * 0.68, sides, 1, false);
  geo.translate(0, height * 0.34, 0);

  const tipGeo = new THREE.ConeGeometry(radius * 0.58, height * 0.32, sides, 1, false);
  tipGeo.translate(0, height * 0.68 + height * 0.16, 0);

  const g1 = geo.toNonIndexed();
  const g2 = tipGeo.toNonIndexed();
  const pos1 = g1.attributes.position.array as Float32Array;
  const pos2 = g2.attributes.position.array as Float32Array;
  const combined = new Float32Array(pos1.length + pos2.length);
  combined.set(pos1, 0);
  combined.set(pos2, pos1.length);

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.BufferAttribute(combined, 3));
  merged.computeVertexNormals();

  geo.dispose();
  tipGeo.dispose();
  g1.dispose();
  g2.dispose();

  return merged;
}

export const HabitIslandCanvas: React.FC<HabitIslandCanvasProps> = ({
  completionRate = 50,
  completedCount = 3,
  totalCount = 6,
  pulseTrigger = 0,
  userXP = 1450,
}) => {
  const [hasWebGL] = useState(() => checkWebGLSupport());
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // References to communicate real-time reactive state into the RAF render loop
  const completionRateRef = useRef(completionRate);
  const userXPRef = useRef(userXP);
  const spawnBurstRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    completionRateRef.current = completionRate;
  }, [completionRate]);

  useEffect(() => {
    userXPRef.current = userXP;
  }, [userXP]);

  // Trigger habit completion shockwave ripple and sparkle bursts
  useEffect(() => {
    if (pulseTrigger > 0 && spawnBurstRef.current) {
      spawnBurstRef.current();
    }
  }, [pulseTrigger]);

  // Reduced motion preference
  const [prefersReducedMotion] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  });

  // Calculate Sanctuary Stage from userXP (Stage 1 to 5)
  const sanctuaryStage = Math.max(1, Math.min(5, Math.floor(userXP / 400) + 1));

  // Initialize and mount the genuine 3D Three.js Island Scene
  useEffect(() => {
    if (!hasWebGL || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;

    // 1. Scene, Camera & Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060814, 0.018);

    const camera = new THREE.PerspectiveCamera(
      36,
      container.clientWidth / container.clientHeight,
      0.1,
      200
    );
    const baseCameraPos = new THREE.Vector3(0, 2.2, 14.5);
    camera.position.copy(baseCameraPos);
    camera.lookAt(0, -0.35, 0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    // 2. Hierarchy Groups
    const SanctuaryRoot = new THREE.Group();
    scene.add(SanctuaryRoot);

    const IslandPivot = new THREE.Group();
    SanctuaryRoot.add(IslandPivot);

    const groups = {
      Island_Base: new THREE.Group(),
      Monk: new THREE.Group(),
      Crystal_Core: new THREE.Group(),
      Trees: new THREE.Group(),
      Glow_Paths: new THREE.Group(),
      Ambient_Particles: new THREE.Group(),
    };

    IslandPivot.add(groups.Island_Base);
    IslandPivot.add(groups.Monk);
    IslandPivot.add(groups.Crystal_Core);
    IslandPivot.add(groups.Trees);
    IslandPivot.add(groups.Glow_Paths);
    SanctuaryRoot.add(groups.Ambient_Particles);

    // 3. Cinematic Lighting
    const ambientLight = new THREE.AmbientLight(0x283056, 1.35);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x7c6aff, 0x0a1c2e, 0.85);
    hemiLight.position.set(0, 15, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfff0dd, 1.35);
    dirLight.position.set(6, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 2;
    dirLight.shadow.camera.far = 30;
    const d = 6.5;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0008;
    scene.add(dirLight);

    const crystalLight = new THREE.PointLight(0xa370ff, 3.2, 14, 1.6);
    crystalLight.position.set(0, 2.2, -1.05);
    crystalLight.castShadow = true;
    crystalLight.shadow.bias = -0.001;
    IslandPivot.add(crystalLight);

    const underCyanLight = new THREE.PointLight(0x00e5ff, 1.8, 12, 1.8);
    underCyanLight.position.set(0, -3.5, 1.8);
    IslandPivot.add(underCyanLight);

    // 4. Build Island Base (Faceted Basalt Underbelly, Soil & Mossy Pads)
    interface SubRockData {
      mesh: THREE.Mesh;
      baseY: number;
      speed: number;
      amp: number;
      phase: number;
      rotSpeed: number;
    }
    const floatingSubRocks: SubRockData[] = [];

    const radius = 4.55;
    const height = 4.6;
    const coneGeo = new THREE.ConeGeometry(radius, height, 44, 22, false);
    coneGeo.rotateX(Math.PI);
    coneGeo.translate(0, -height / 2, 0);

    const pos = coneGeo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const dist2D = Math.sqrt(v.x * v.x + v.z * v.z);
      const angle = Math.atan2(v.z, v.x);

      if (v.y > -0.08) {
        const rimWave =
          1.0 +
          0.1 * Math.sin(angle * 5 + 0.6) +
          0.07 * Math.cos(angle * 8 - 0.4) +
          0.05 * Math.sin(angle * 3);
        v.x *= rimWave;
        v.z *= rimWave;
        const normR = Math.min(1, dist2D / radius);
        v.y = 0.12 * Math.sin(normR * Math.PI) + 0.04 * pseudoNoise3D(v.x, 0, v.z);
      } else {
        const depthRatio = Math.min(1, Math.abs(v.y) / height);
        const profileScale =
          Math.pow(1 - depthRatio, 0.68) * (1.08 + 0.18 * Math.sin(depthRatio * Math.PI));
        const cragMacro =
          0.18 * Math.sin(angle * 6 + v.y * 1.4) +
          0.14 * Math.cos(angle * 9 - v.y * 2.1) +
          0.1 * Math.sin(angle * 4 + 1.2);
        const cragMicro = 0.22 * pseudoNoise3D(v.x * 0.9, v.y * 1.1, v.z * 0.9);
        const radialFactor = profileScale + (cragMacro + cragMicro) * (1 - depthRatio * 0.45);
        const origR = Math.max(0.001, dist2D);
        const targetR = radius * Math.max(0.03, radialFactor);

        if (origR > 0.01) {
          v.x = (v.x / origR) * targetR;
          v.z = (v.z / origR) * targetR;
        }
        v.y += 0.16 * Math.sin(angle * 7 + v.y * 3.0) * (1 - depthRatio * 0.5);
      }
      pos.setXYZ(i, v.x, v.y, v.z);
    }

    const nonIndexedRockGeo = coneGeo.toNonIndexed();
    nonIndexedRockGeo.computeVertexNormals();

    const rockMat = new THREE.MeshStandardMaterial({
      color: 0x161926,
      roughness: 0.84,
      metalness: 0.18,
      flatShading: true,
    });

    const mainRockMesh = new THREE.Mesh(nonIndexedRockGeo, rockMat);
    mainRockMesh.castShadow = true;
    mainRockMesh.receiveShadow = true;
    groups.Island_Base.add(mainRockMesh);

    // Perimeter Basalt Cliff Chunks
    const perimeterChunkGeo = new THREE.DodecahedronGeometry(1, 1);
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + (i % 2) * 0.12;
      const dist = 3.75 + (i % 3) * 0.28;
      const chunk = perimeterChunkGeo.clone();
      const cPos = chunk.attributes.position;
      for (let j = 0; j < cPos.count; j++) {
        const px = cPos.getX(j);
        const py = cPos.getY(j);
        const pz = cPos.getZ(j);
        cPos.setXYZ(
          j,
          px * (0.85 + 0.25 * Math.sin(j + i)),
          py * (1.15 + 0.2 * Math.cos(j)),
          pz * (0.85 + 0.25 * Math.cos(j * 1.7))
        );
      }
      const flatChunk = chunk.toNonIndexed();
      flatChunk.computeVertexNormals();
      const chunkMesh = new THREE.Mesh(flatChunk, rockMat);
      chunkMesh.position.set(
        Math.cos(angle) * dist,
        -0.65 - (i % 3) * 0.28,
        Math.sin(angle) * dist
      );
      chunkMesh.rotation.set(0.3 * Math.sin(i), angle + 0.5, 0.25 * Math.cos(i));
      chunkMesh.scale.set(0.95, 1.15, 0.85);
      chunkMesh.castShadow = true;
      chunkMesh.receiveShadow = true;
      groups.Island_Base.add(chunkMesh);
    }

    // Soil Clearing
    const soilGeo = new THREE.CylinderGeometry(3.7, 3.85, 0.28, 36, 4);
    const sPos = soilGeo.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
      const vx = sPos.getX(i);
      const vy = sPos.getY(i);
      const vz = sPos.getZ(i);
      const r = Math.sqrt(vx * vx + vz * vz);
      const ang = Math.atan2(vz, vx);
      const wave = 1 + 0.08 * Math.sin(ang * 6) + 0.05 * Math.cos(ang * 9);
      const topRipple =
        vy > 0 ? 0.045 * pseudoNoise3D(vx * 1.4, 0, vz * 1.4) - 0.02 * Math.max(0, r - 2.2) : 0;
      sPos.setXYZ(i, vx * wave, vy + topRipple, vz * wave);
    }
    const flatSoilGeo = soilGeo.toNonIndexed();
    flatSoilGeo.computeVertexNormals();
    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x6b5039,
      roughness: 0.92,
      metalness: 0.04,
      flatShading: true,
    });
    const soilMesh = new THREE.Mesh(flatSoilGeo, soilMat);
    soilMesh.position.y = 0.02;
    soilMesh.receiveShadow = true;
    groups.Island_Base.add(soilMesh);

    // Inner Worn Soil Path
    const innerPathGeo = new THREE.CylinderGeometry(1.75, 1.9, 0.08, 28);
    const innerPathG = innerPathGeo.toNonIndexed();
    innerPathG.computeVertexNormals();
    const innerSoilMat = new THREE.MeshStandardMaterial({
      color: 0x7d5e44,
      roughness: 0.95,
      metalness: 0.02,
      flatShading: true,
    });
    const innerSoilMesh = new THREE.Mesh(innerPathG, innerSoilMat);
    innerSoilMesh.position.set(0, 0.14, 0.35);
    innerSoilMesh.scale.set(1.15, 1, 0.95);
    innerSoilMesh.receiveShadow = true;
    groups.Island_Base.add(innerSoilMesh);

    // Moss Mounds
    const mossColors = [0x3b6928, 0x487a31, 0x2f5921, 0x528538];
    const mossConfigs = [
      { x: -2.1, y: 0.25, z: -0.65, sx: 1.85, sy: 0.48, sz: 1.55, col: 0 },
      { x: -2.85, y: 0.14, z: 0.65, sx: 1.55, sy: 0.36, sz: 1.35, col: 1 },
      { x: -1.65, y: 0.12, z: 1.95, sx: 1.45, sy: 0.32, sz: 1.15, col: 2 },
      { x: -0.45, y: 0.08, z: 2.85, sx: 1.15, sy: 0.25, sz: 0.85, col: 0 },
      { x: 2.15, y: 0.2, z: -0.75, sx: 1.75, sy: 0.42, sz: 1.45, col: 1 },
      { x: 2.75, y: 0.14, z: 0.65, sx: 1.55, sy: 0.35, sz: 1.3, col: 0 },
      { x: 1.65, y: 0.12, z: 1.85, sx: 1.45, sy: 0.32, sz: 1.15, col: 3 },
      { x: -1.6, y: 0.22, z: -2.15, sx: 1.35, sy: 0.38, sz: 1.15, col: 2 },
      { x: 1.6, y: 0.22, z: -2.15, sx: 1.35, sy: 0.38, sz: 1.15, col: 0 },
      { x: -3.65, y: -0.02, z: 1.45, sx: 0.95, sy: 0.36, sz: 0.85, col: 1 },
      { x: -3.85, y: 0.02, z: -0.25, sx: 1.05, sy: 0.38, sz: 0.95, col: 2 },
      { x: 3.65, y: -0.02, z: 1.35, sx: 0.95, sy: 0.36, sz: 0.85, col: 2 },
      { x: 3.8, y: 0.02, z: -0.2, sx: 1.0, sy: 0.35, sz: 0.9, col: 0 },
      { x: 2.55, y: -0.04, z: 2.75, sx: 0.95, sy: 0.34, sz: 0.8, col: 1 },
      { x: -2.45, y: -0.04, z: 2.85, sx: 0.95, sy: 0.34, sz: 0.8, col: 3 },
    ];
    const baseMossGeo = new THREE.IcosahedronGeometry(1, 2);
    mossConfigs.forEach((cfg, idx) => {
      const g = baseMossGeo.clone();
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        let vx = p.getX(i);
        let vy = p.getY(i);
        let vz = p.getZ(i);
        if (vy < 0) vy *= 0.35;
        const n = 1 + 0.18 * pseudoNoise3D(vx * 2 + idx, vy * 2, vz * 2 + idx);
        p.setXYZ(i, vx * n, vy * n, vz * n);
      }
      const flatMoss = g.toNonIndexed();
      flatMoss.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({
        color: mossColors[cfg.col],
        roughness: 0.88,
        metalness: 0.03,
        flatShading: true,
      });
      const mesh = new THREE.Mesh(flatMoss, mat);
      mesh.position.set(cfg.x, cfg.y, cfg.z);
      mesh.scale.set(cfg.sx, cfg.sy, cfg.sz);
      mesh.rotation.y = idx * 0.7;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      groups.Island_Base.add(mesh);
    });

    // Detached Floating Sub-Rocks
    const subRockCount = 26;
    for (let i = 0; i < subRockCount; i++) {
      const sGeo = new THREE.DodecahedronGeometry(0.14 + (i % 4) * 0.07, 0);
      sGeo.computeVertexNormals();
      const sMesh = new THREE.Mesh(sGeo, rockMat);
      const ang = (i / subRockCount) * Math.PI * 2 + (i % 3) * 0.4;
      const radiusSpread = 0.4 + ((i * 7) % 10) * 0.36;
      const baseY = -2.4 - (1 - radiusSpread / 4.2) * 2.2 - (i % 5) * 0.28;

      sMesh.position.set(Math.cos(ang) * radiusSpread, baseY, Math.sin(ang) * radiusSpread);
      sMesh.rotation.set(i * 0.8, i * 1.3, i * 0.5);
      sMesh.castShadow = true;
      groups.Island_Base.add(sMesh);

      floatingSubRocks.push({
        mesh: sMesh,
        baseY,
        speed: 1.1 + (i % 5) * 0.25,
        amp: 0.06 + (i % 4) * 0.03,
        phase: i * 0.9,
        rotSpeed: (i % 2 === 0 ? 1 : -1) * (0.15 + (i % 3) * 0.08),
      });
    }

    // 5. Build Meditating Monk (3D Model)
    const monkRoot = new THREE.Group();
    monkRoot.position.set(0, 0.18, 0.42);
    groups.Monk.add(monkRoot);

    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xf2aa7e,
      roughness: 0.62,
      metalness: 0.04,
    });
    const saffronMat = new THREE.MeshStandardMaterial({
      color: 0xe87a24,
      roughness: 0.75,
      metalness: 0.05,
    });
    const burgundyMat = new THREE.MeshStandardMaterial({
      color: 0x6e283b,
      roughness: 0.8,
      metalness: 0.05,
    });
    const wrapMat = new THREE.MeshStandardMaterial({
      color: 0xd8c3a5,
      roughness: 0.85,
      metalness: 0.02,
    });
    const featureMat = new THREE.MeshStandardMaterial({
      color: 0x4a2518,
      roughness: 0.7,
    });

    // Crossed Legs Base
    const hipBase = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.54, 0.22, 24), burgundyMat);
    hipBase.position.set(0, 0.11, 0);
    hipBase.scale.set(1.25, 1, 0.92);
    hipBase.castShadow = true;
    monkRoot.add(hipBase);

    // Thighs & Knees
    const legGeo = new THREE.CylinderGeometry(0.15, 0.17, 0.62, 16);
    legGeo.rotateZ(Math.PI / 2);

    const leftThigh = new THREE.Mesh(legGeo, burgundyMat);
    leftThigh.position.set(-0.28, 0.14, 0.12);
    leftThigh.rotation.set(0, 0.42, -0.08);
    leftThigh.castShadow = true;
    monkRoot.add(leftThigh);

    const rightThigh = new THREE.Mesh(legGeo, burgundyMat);
    rightThigh.position.set(0.28, 0.14, 0.12);
    rightThigh.rotation.set(0, -0.42, 0.08);
    rightThigh.castShadow = true;
    monkRoot.add(rightThigh);

    const kneeGeo = new THREE.SphereGeometry(0.165, 16, 16);
    const leftKnee = new THREE.Mesh(kneeGeo, burgundyMat);
    leftKnee.position.set(-0.54, 0.14, 0.24);
    leftKnee.castShadow = true;
    monkRoot.add(leftKnee);

    const rightKnee = new THREE.Mesh(kneeGeo, burgundyMat);
    rightKnee.position.set(0.54, 0.14, 0.24);
    rightKnee.castShadow = true;
    monkRoot.add(rightKnee);

    // Shins & Feet
    const shinWrapGeo = new THREE.CylinderGeometry(0.1, 0.11, 0.34, 14);
    shinWrapGeo.rotateZ(Math.PI / 2);
    const leftShin = new THREE.Mesh(shinWrapGeo, wrapMat);
    leftShin.position.set(-0.18, 0.11, 0.35);
    leftShin.rotation.y = -0.25;
    monkRoot.add(leftShin);

    const rightShin = new THREE.Mesh(shinWrapGeo, wrapMat);
    rightShin.position.set(0.18, 0.11, 0.35);
    rightShin.rotation.y = 0.25;
    monkRoot.add(rightShin);

    const footGeo = new THREE.SphereGeometry(0.095, 12, 12);
    const leftFoot = new THREE.Mesh(footGeo, skinMat);
    leftFoot.position.set(0.05, 0.09, 0.41);
    leftFoot.scale.set(1.2, 0.7, 0.9);
    monkRoot.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeo, skinMat);
    rightFoot.position.set(-0.05, 0.09, 0.41);
    rightFoot.scale.set(1.2, 0.7, 0.9);
    monkRoot.add(rightFoot);

    // Breathing Torso Group
    const monkBreathGroup = new THREE.Group();
    monkBreathGroup.position.set(0, 0.22, 0);
    monkRoot.add(monkBreathGroup);

    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.33, 0.56, 20), burgundyMat);
    torso.position.set(0, 0.26, 0);
    torso.scale.set(1.05, 1, 0.82);
    torso.castShadow = true;
    monkBreathGroup.add(torso);

    const chestSkin = new THREE.Mesh(new THREE.SphereGeometry(0.23, 16, 16), skinMat);
    chestSkin.position.set(0.06, 0.43, 0.02);
    chestSkin.scale.set(1.1, 0.78, 0.78);
    chestSkin.castShadow = true;
    monkBreathGroup.add(chestSkin);

    const kasaya = new THREE.Mesh(new THREE.CylinderGeometry(0.255, 0.345, 0.54, 20), saffronMat);
    kasaya.position.set(-0.02, 0.26, 0.01);
    kasaya.scale.set(1.06, 1, 0.85);
    kasaya.rotation.z = -0.14;
    kasaya.castShadow = true;
    monkBreathGroup.add(kasaya);

    const sash = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.065, 12, 24), saffronMat);
    sash.position.set(-0.02, 0.36, 0.03);
    sash.rotation.set(0.85, 0.48, -0.55);
    sash.scale.set(1.05, 1.15, 0.85);
    monkBreathGroup.add(sash);

    // Arms in lap (Dhyana Mudra)
    const upperArmGeo = new THREE.CylinderGeometry(0.095, 0.085, 0.36, 14);
    const leftUpperArm = new THREE.Mesh(upperArmGeo, saffronMat);
    leftUpperArm.position.set(-0.31, 0.34, 0.04);
    leftUpperArm.rotation.set(0.25, 0, -0.38);
    monkBreathGroup.add(leftUpperArm);

    const rightUpperArm = new THREE.Mesh(upperArmGeo, burgundyMat);
    rightUpperArm.position.set(0.31, 0.34, 0.04);
    rightUpperArm.rotation.set(0.25, 0, 0.38);
    monkBreathGroup.add(rightUpperArm);

    const forearmGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.34, 14);
    const leftForearm = new THREE.Mesh(forearmGeo, burgundyMat);
    leftForearm.position.set(-0.22, 0.14, 0.2);
    leftForearm.rotation.set(1.15, 0.55, -0.65);
    monkBreathGroup.add(leftForearm);

    const rightForearm = new THREE.Mesh(forearmGeo, burgundyMat);
    rightForearm.position.set(0.22, 0.14, 0.2);
    rightForearm.rotation.set(1.15, -0.55, 0.65);
    monkBreathGroup.add(rightForearm);

    const handGeo = new THREE.SphereGeometry(0.075, 14, 14);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.set(-0.05, 0.06, 0.3);
    leftHand.scale.set(1.25, 0.55, 0.85);
    monkBreathGroup.add(leftHand);

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.set(0.05, 0.07, 0.3);
    rightHand.scale.set(1.25, 0.55, 0.85);
    monkBreathGroup.add(rightHand);

    // Neck & Serene Head
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.105, 0.14, 14), skinMat);
    neck.position.set(0, 0.56, 0.02);
    monkBreathGroup.add(neck);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.84, 0.04);
    headGroup.rotation.x = 0.06;
    monkBreathGroup.add(headGroup);

    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.285, 28, 28), skinMat);
    headMesh.scale.set(0.96, 1.05, 0.98);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Eyes, Brows, Nose, Bindi, Smile
    const eyeArcGeo = new THREE.TorusGeometry(0.042, 0.009, 8, 16, Math.PI);
    const leftEye = new THREE.Mesh(eyeArcGeo, featureMat);
    leftEye.position.set(-0.095, -0.01, 0.268);
    leftEye.rotation.set(0.15, -0.18, Math.PI);
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeArcGeo, featureMat);
    rightEye.position.set(0.095, -0.01, 0.268);
    rightEye.rotation.set(0.15, 0.18, Math.PI);
    headGroup.add(rightEye);

    const browGeo = new THREE.TorusGeometry(0.048, 0.008, 8, 16, Math.PI * 0.85);
    const leftBrow = new THREE.Mesh(browGeo, featureMat);
    leftBrow.position.set(-0.098, 0.035, 0.265);
    leftBrow.rotation.set(-0.1, -0.18, 0.12);
    headGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, featureMat);
    rightBrow.position.set(0.098, 0.035, 0.265);
    rightBrow.rotation.set(-0.1, 0.18, 0.05);
    headGroup.add(rightBrow);

    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.028, 12, 12), skinMat);
    nose.position.set(0, -0.045, 0.282);
    nose.scale.set(1.1, 0.85, 0.9);
    headGroup.add(nose);

    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 8), featureMat);
    dot.position.set(0, 0.095, 0.273);
    headGroup.add(dot);

    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.032, 0.007, 8, 14, Math.PI * 0.85), featureMat);
    smile.position.set(0, -0.095, 0.266);
    smile.rotation.set(0.2, 0, Math.PI + 0.22);
    headGroup.add(smile);

    // 6. Build Faceted Violet Crystal Spire Cluster
    const crystalMaterials: THREE.MeshPhysicalMaterial[] = [];
    const crystalInnerCores: THREE.MeshBasicMaterial[] = [];
    interface AuraSpriteData {
      sprite: THREE.Sprite;
      baseScale: number;
      baseOpacity: number;
      speed: number;
      phase: number;
    }
    const auraSprites: AuraSpriteData[] = [];

    const mainCrystalCluster = new THREE.Group();
    mainCrystalCluster.position.set(0, 0.05, -1.25);
    groups.Crystal_Core.add(mainCrystalCluster);

    const outerCrystalMat = new THREE.MeshPhysicalMaterial({
      color: 0x9b72ff,
      emissive: 0x5c2be0,
      emissiveIntensity: 0.55,
      roughness: 0.14,
      metalness: 0.08,
      transmission: 0.72,
      transparent: true,
      opacity: 0.9,
      reflectivity: 0.9,
      flatShading: true,
    });
    crystalMaterials.push(outerCrystalMat);

    const innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0xdcc2ff,
      transparent: true,
      opacity: 0.58,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    crystalInnerCores.push(innerCoreMat);

    const spireSpecs = [
      { x: 0.0, y: 0.0, z: 0.0, r: 0.78, h: 3.35, sides: 7, rx: 0.02, ry: 0.35, rz: 0.0 },
      { x: -0.68, y: -0.05, z: 0.12, r: 0.42, h: 1.95, sides: 6, rx: 0.08, ry: 0.9, rz: 0.34 },
      { x: 0.68, y: -0.05, z: 0.1, r: 0.45, h: 2.1, sides: 6, rx: 0.06, ry: -0.6, rz: -0.3 },
      { x: -0.38, y: -0.1, z: -0.35, r: 0.32, h: 1.45, sides: 6, rx: -0.18, ry: 0.2, rz: 0.22 },
      { x: 0.42, y: -0.1, z: -0.32, r: 0.3, h: 1.38, sides: 6, rx: -0.16, ry: -0.4, rz: -0.2 },
    ];

    spireSpecs.forEach((sp) => {
      const cGeo = createFacetedCrystalGeometry(sp.r, sp.h, sp.sides);
      const cMesh = new THREE.Mesh(cGeo, outerCrystalMat);
      cMesh.position.set(sp.x, sp.y, sp.z);
      cMesh.rotation.set(sp.rx, sp.ry, sp.rz);
      cMesh.castShadow = true;
      mainCrystalCluster.add(cMesh);

      const innerGeo = createFacetedCrystalGeometry(sp.r * 0.52, sp.h * 0.86, sp.sides);
      const innerMesh = new THREE.Mesh(innerGeo, innerCoreMat);
      innerMesh.position.set(sp.x, sp.y + 0.08, sp.z);
      innerMesh.rotation.set(sp.rx, sp.ry, sp.rz);
      mainCrystalCluster.add(innerMesh);
    });

    // Perimeter Rim Crystals
    const perimeterCrystals = [
      { x: -3.55, y: 0.06, z: 1.05, r: 0.22, h: 0.78, rx: 0.15, ry: 0.4, rz: 0.28 },
      { x: -3.72, y: 0.04, z: 1.22, r: 0.15, h: 0.52, rx: 0.28, ry: 1.1, rz: 0.48 },
      { x: 3.48, y: 0.06, z: 0.95, r: 0.23, h: 0.8, rx: 0.12, ry: -0.5, rz: -0.26 },
      { x: 3.68, y: 0.04, z: 1.12, r: 0.16, h: 0.54, rx: 0.25, ry: 0.8, rz: -0.46 },
    ];
    perimeterCrystals.forEach((pc) => {
      const pGeo = createFacetedCrystalGeometry(pc.r, pc.h, 6);
      const pMesh = new THREE.Mesh(pGeo, outerCrystalMat);
      pMesh.position.set(pc.x, pc.y, pc.z);
      pMesh.rotation.set(pc.rx, pc.ry, pc.rz);
      pMesh.castShadow = true;
      groups.Crystal_Core.add(pMesh);
    });

    // Halos behind the crystal
    const auraTex = createAuraRingTexture();
    const softGlowTex = createRadialGlowTexture(
      'rgba(195, 155, 255, 0.65)',
      'rgba(135, 90, 245, 0.28)',
      'rgba(75, 40, 170, 0.0)'
    );

    const backGlowMat = new THREE.SpriteMaterial({
      map: softGlowTex,
      color: 0xb388ff,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const backGlowSprite = new THREE.Sprite(backGlowMat);
    backGlowSprite.position.set(0, 2.0, -1.65);
    backGlowSprite.scale.set(6.2, 6.2, 1);
    groups.Crystal_Core.add(backGlowSprite);
    auraSprites.push({ sprite: backGlowSprite, baseScale: 6.2, baseOpacity: 0.75, speed: 1.4, phase: 0 });

    const haloSprite1 = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: auraTex,
        color: 0xc5a3ff,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    haloSprite1.position.set(0, 2.25, -1.75);
    haloSprite1.scale.set(4.8, 4.8, 1);
    groups.Crystal_Core.add(haloSprite1);
    auraSprites.push({ sprite: haloSprite1, baseScale: 4.8, baseOpacity: 0.65, speed: 1.9, phase: 1.2 });

    // 7. Build Trees & Flora (Independent Lifetime Growth System)
    interface SwayData {
      obj: THREE.Object3D;
      speed: number;
      amp: number;
      phase: number;
    }
    interface GrowthData {
      obj: THREE.Object3D;
      baseScale: number;
      minThreshold: number;
    }
    const swayObjects: SwayData[] = [];
    const growthItems: GrowthData[] = [];

    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x4b3626,
      roughness: 0.9,
      metalness: 0.04,
      flatShading: true,
    });
    const leafMatDark = new THREE.MeshStandardMaterial({
      color: 0x264e2c,
      roughness: 0.82,
      metalness: 0.04,
      flatShading: true,
    });
    const leafMatMid = new THREE.MeshStandardMaterial({
      color: 0x366938,
      roughness: 0.8,
      metalness: 0.04,
      flatShading: true,
    });
    const leafMatLight = new THREE.MeshStandardMaterial({
      color: 0x4a8244,
      roughness: 0.78,
      metalness: 0.04,
      flatShading: true,
    });

    function createBonsaiTree(
      curvePoints: THREE.Vector3[],
      trunkRadius: number,
      canopyPads: { x: number; y: number; z: number; r: number }[],
      minProgressThreshold: number
    ) {
      const treeGroup = new THREE.Group();
      const curve = new THREE.CatmullRomCurve3(curvePoints);
      const tubeGeo = new THREE.TubeGeometry(curve, 16, trunkRadius, 8, false);

      const pArr = tubeGeo.attributes.position;
      const tVec = new THREE.Vector3();
      for (let i = 0; i < pArr.count; i++) {
        tVec.fromBufferAttribute(pArr, i);
        const heightProgress = Math.max(0, Math.min(1, (tVec.y - curvePoints[0].y) / 2.2));
        const taper = 1 - heightProgress * 0.55;
        const center = curve.getPointAt(Math.min(1, Math.max(0, heightProgress)));
        tVec.x = center.x + (tVec.x - center.x) * taper;
        tVec.z = center.z + (tVec.z - center.z) * taper;
        pArr.setXYZ(i, tVec.x, tVec.y, tVec.z);
      }
      const flatTrunk = tubeGeo.toNonIndexed();
      flatTrunk.computeVertexNormals();
      const trunkMesh = new THREE.Mesh(flatTrunk, trunkMat);
      trunkMesh.castShadow = true;
      treeGroup.add(trunkMesh);

      const crownGroup = new THREE.Group();
      canopyPads.forEach((pad, idx) => {
        const mat = idx % 3 === 0 ? leafMatMid : idx % 3 === 1 ? leafMatLight : leafMatDark;
        const geo = new THREE.IcosahedronGeometry(pad.r, 2);
        const posAttr = geo.attributes.position;
        for (let i = 0; i < posAttr.count; i++) {
          const vx = posAttr.getX(i);
          const vy = posAttr.getY(i);
          const vz = posAttr.getZ(i);
          const n = 1 + 0.22 * pseudoNoise3D(vx * 2.2 + idx, vy * 2.2, vz * 2.2 + idx);
          posAttr.setXYZ(i, vx * n, vy * 0.52 * n, vz * n);
        }
        const flatPad = geo.toNonIndexed();
        flatPad.computeVertexNormals();
        const padMesh = new THREE.Mesh(flatPad, mat);
        padMesh.position.set(pad.x, pad.y, pad.z);
        padMesh.castShadow = true;
        crownGroup.add(padMesh);
      });
      treeGroup.add(crownGroup);
      groups.Trees.add(treeGroup);

      swayObjects.push({
        obj: crownGroup,
        speed: 1.3 + Math.random() * 0.5,
        amp: 0.028,
        phase: Math.random() * Math.PI * 2,
      });
      growthItems.push({
        obj: treeGroup,
        baseScale: 1.0,
        minThreshold: minProgressThreshold,
      });
    }

    // Hero Bonsai Trees
    createBonsaiTree(
      [
        new THREE.Vector3(-1.85, 0.32, -0.65),
        new THREE.Vector3(-2.15, 0.95, -0.7),
        new THREE.Vector3(-2.55, 1.55, -0.55),
        new THREE.Vector3(-2.3, 2.25, -0.45),
        new THREE.Vector3(-2.5, 2.65, -0.4),
      ],
      0.18,
      [
        { x: -2.45, y: 2.75, z: -0.42, r: 0.85 },
        { x: -1.95, y: 2.4, z: -0.35, r: 0.68 },
        { x: -2.85, y: 2.25, z: -0.55, r: 0.72 },
      ],
      0.0
    );

    createBonsaiTree(
      [
        new THREE.Vector3(-3.05, 0.18, 0.45),
        new THREE.Vector3(-3.45, 0.62, 0.52),
        new THREE.Vector3(-3.82, 1.15, 0.45),
        new THREE.Vector3(-3.65, 1.58, 0.38),
      ],
      0.13,
      [
        { x: -3.72, y: 1.65, z: 0.38, r: 0.62 },
        { x: -4.05, y: 1.38, z: 0.5, r: 0.52 },
      ],
      0.18
    );

    createBonsaiTree(
      [
        new THREE.Vector3(1.85, 0.28, -1.05),
        new THREE.Vector3(2.05, 0.85, -1.1),
        new THREE.Vector3(2.25, 1.45, -0.98),
        new THREE.Vector3(2.12, 1.92, -0.92),
      ],
      0.12,
      [
        { x: 2.15, y: 2.02, z: -0.92, r: 0.58 },
        { x: 2.45, y: 1.75, z: -0.85, r: 0.48 },
      ],
      0.25
    );

    // Glowing Lavender Flowers
    const flowerPetalMat = new THREE.MeshStandardMaterial({
      color: 0xd9a7ff,
      emissive: 0x9b4dff,
      emissiveIntensity: 0.85,
      roughness: 0.35,
    });
    const flowerSpots = [
      { x: -1.85, y: 0.22, z: 0.92, s: 1.35, t: 0.1 },
      { x: -1.25, y: 0.25, z: -0.35, s: 1.25, t: 0.2 },
      { x: 1.45, y: 0.2, z: -0.25, s: 1.1, t: 0.25 },
      { x: 2.35, y: 0.16, z: 1.25, s: 0.95, t: 0.5 },
    ];
    flowerSpots.forEach((fl) => {
      const fGroup = new THREE.Group();
      fGroup.position.set(fl.x, fl.y, fl.z);
      const stemMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.014, 0.018, 0.28 * fl.s, 6),
        leafMatMid
      );
      stemMesh.position.y = 0.14 * fl.s;
      fGroup.add(stemMesh);

      const petalGeo = new THREE.ConeGeometry(0.045 * fl.s, 0.12 * fl.s, 5);
      petalGeo.rotateX(Math.PI * 0.38);
      petalGeo.translate(0, 0.02 * fl.s, 0.045 * fl.s);
      for (let pIdx = 0; pIdx < 5; pIdx++) {
        const p = new THREE.Mesh(petalGeo, flowerPetalMat);
        p.position.y = 0.28 * fl.s;
        p.rotation.y = (pIdx / 5) * Math.PI * 2;
        fGroup.add(p);
      }
      groups.Trees.add(fGroup);
      growthItems.push({ obj: fGroup, baseScale: 1.0, minThreshold: fl.t });
    });

    // 8. Build Glow Paths & Cyan Fissures
    interface GlowVeinData {
      mat: THREE.MeshBasicMaterial;
      baseOpacity: number;
    }
    const glowVeinMaterials: GlowVeinData[] = [];

    const rockCrackMat = new THREE.MeshBasicMaterial({
      color: 0x29f2ff,
      transparent: true,
      opacity: 0.92,
    });
    glowVeinMaterials.push({ mat: rockCrackMat, baseOpacity: 0.92 });

    const rockCrackHaloMat = new THREE.MeshBasicMaterial({
      color: 0x00c8ff,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    glowVeinMaterials.push({ mat: rockCrackHaloMat, baseOpacity: 0.32 });

    function addEnergyVein(points: THREE.Vector3[], rVal: number) {
      const curve = new THREE.CatmullRomCurve3(points);
      const coreGeo = new THREE.TubeGeometry(curve, 24, rVal, 6, false);
      const coreMesh = new THREE.Mesh(coreGeo, rockCrackMat);
      groups.Glow_Paths.add(coreMesh);

      const haloGeo = new THREE.TubeGeometry(curve, 24, rVal * 2.6, 6, false);
      const haloMesh = new THREE.Mesh(haloGeo, rockCrackHaloMat);
      groups.Glow_Paths.add(haloMesh);
    }

    addEnergyVein(
      [
        new THREE.Vector3(-2.45, -0.45, 2.95),
        new THREE.Vector3(-2.1, -0.95, 3.05),
        new THREE.Vector3(-1.68, -1.32, 2.85),
        new THREE.Vector3(-1.32, -1.78, 2.55),
      ],
      0.028
    );
    addEnergyVein(
      [
        new THREE.Vector3(2.38, -0.32, 2.88),
        new THREE.Vector3(1.88, -0.95, 2.98),
        new THREE.Vector3(1.25, -1.55, 2.75),
        new THREE.Vector3(0.68, -2.25, 2.25),
      ],
      0.032
    );

    // 9. Ambient Particles (Stars, Golden Fireflies, Rising Stardust)
    const goldFireflyTex = createRadialGlowTexture(
      'rgba(255, 250, 210, 1.0)',
      'rgba(255, 200, 95, 0.55)',
      'rgba(255, 140, 20, 0.0)'
    );
    const cyanParticleTex = createRadialGlowTexture(
      'rgba(210, 255, 255, 1.0)',
      'rgba(50, 225, 255, 0.55)',
      'rgba(0, 140, 255, 0.0)'
    );
    const violetParticleTex = createRadialGlowTexture(
      'rgba(240, 210, 255, 1.0)',
      'rgba(175, 105, 255, 0.55)',
      'rgba(95, 30, 210, 0.0)'
    );

    interface FireflyData {
      sprite: THREE.Sprite;
      baseAngle: number;
      radius: number;
      baseY: number;
      orbitSpeed: number;
      bobSpeed: number;
      bobAmp: number;
      phase: number;
      baseScale: number;
      threshold: number;
    }
    const fireflies: FireflyData[] = [];

    // Fireflies
    for (let i = 0; i < 34; i++) {
      const isGold = i % 3 !== 0;
      const fMat = new THREE.SpriteMaterial({
        map: isGold ? goldFireflyTex : cyanParticleTex,
        color: isGold ? 0xffe596 : 0x75f6ff,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(fMat);
      const ang = (i / 34) * Math.PI * 2 + Math.random() * 0.5;
      const rad = 2.2 + Math.random() * 4.8;
      const bY = -2.2 + Math.random() * 5.6;

      sprite.position.set(Math.cos(ang) * rad, bY, Math.sin(ang) * rad);
      const sc = 0.18 + Math.random() * 0.22;
      sprite.scale.set(sc, sc, 1);
      groups.Ambient_Particles.add(sprite);

      fireflies.push({
        sprite,
        baseAngle: ang,
        radius: rad,
        baseY: bY,
        orbitSpeed: (0.06 + Math.random() * 0.1) * (i % 2 === 0 ? 1 : -1),
        bobSpeed: 0.9 + Math.random() * 1.1,
        bobAmp: 0.25 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2,
        baseScale: sc,
        threshold: (i / 34) * 0.85,
      });
    }

    // Rising Stardust Points
    const dustCount = 70;
    const dustPos = new Float32Array(dustCount * 3);
    const risingDustData: { angle: number; radius: number; speedY: number; driftPhase: number }[] = [];
    for (let i = 0; i < dustCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const rad = 1.0 + Math.random() * 4.8;
      const y = -3.8 + Math.random() * 7.5;
      dustPos[i * 3] = Math.cos(a) * rad;
      dustPos[i * 3 + 1] = y;
      dustPos[i * 3 + 2] = Math.sin(a) * rad;
      risingDustData.push({
        angle: a,
        radius: rad,
        speedY: 0.25 + Math.random() * 0.45,
        driftPhase: Math.random() * Math.PI * 2,
      });
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 0.2,
      map: violetParticleTex,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const risingDustSystem = new THREE.Points(dustGeo, dustMat);
    groups.Ambient_Particles.add(risingDustSystem);

    // 10. Habit Completion Ripple & Sparkle Burst Engine
    interface RippleData {
      mesh: THREE.Mesh;
      age: number;
      maxAge: number;
      startScale: number;
      endScale: number;
    }
    interface BurstParticleData {
      sprite: THREE.Sprite;
      vel: THREE.Vector3;
      age: number;
      maxAge: number;
      baseScale: number;
    }
    const activeRipples: RippleData[] = [];
    const activeBurstParticles: BurstParticleData[] = [];
    let habitBurstIntensity = 0;

    const spawnCompletionEffects = () => {
      habitBurstIntensity = 1.0;

      // Expanding Cyan 3D Torus Ripple
      const ringGeo = new THREE.TorusGeometry(1.1, 0.045, 16, 64);
      ringGeo.rotateX(Math.PI / 2);
      const ringMesh = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({
          color: 0x38f6ff,
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      ringMesh.position.set(0, 0.35, 0);
      IslandPivot.add(ringMesh);
      activeRipples.push({ mesh: ringMesh, age: 0, maxAge: 1.85, startScale: 1.0, endScale: 5.4 });

      // Secondary Violet Wave
      const waveGeo = new THREE.TorusGeometry(0.85, 0.035, 14, 56);
      waveGeo.rotateX(Math.PI / 2);
      const waveMesh = new THREE.Mesh(
        waveGeo,
        new THREE.MeshBasicMaterial({
          color: 0xc288ff,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
      );
      waveMesh.position.set(0, 1.35, -1.1);
      IslandPivot.add(waveMesh);
      activeRipples.push({ mesh: waveMesh, age: 0, maxAge: 1.45, startScale: 0.8, endScale: 4.5 });

      // Sparkle Burst
      for (let i = 0; i < 28; i++) {
        const isCyan = i % 2 === 0;
        const sMat = new THREE.SpriteMaterial({
          map: isCyan ? cyanParticleTex : goldFireflyTex,
          color: isCyan ? 0x60f8ff : 0xe4b8ff,
          transparent: true,
          opacity: 1.0,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const sp = new THREE.Sprite(sMat);
        sp.position.set(
          (Math.random() - 0.5) * 1.2,
          1.2 + Math.random() * 1.4,
          -1.1 + (Math.random() - 0.5) * 0.8
        );
        const sc = 0.22 + Math.random() * 0.26;
        sp.scale.set(sc, sc, 1);
        IslandPivot.add(sp);

        const theta = Math.random() * Math.PI * 2;
        const speed = 1.8 + Math.random() * 2.8;
        activeBurstParticles.push({
          sprite: sp,
          vel: new THREE.Vector3(
            Math.cos(theta) * speed,
            0.8 + Math.random() * 2.2,
            Math.sin(theta) * speed
          ),
          age: 0,
          maxAge: 1.1 + Math.random() * 0.5,
          baseScale: sc,
        });
      }
    };

    spawnBurstRef.current = spawnCompletionEffects;

    // 11. Pointer Interaction (Camera Parallax & Safe Drag to Inspect — NO FAKE PROGRESS ON CLICK)
    const pointerTarget = new THREE.Vector2(0, 0);
    const pointerSmoothed = new THREE.Vector2(0, 0);
    let isPointerInside = false;
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    const dragRotation = { x: 0, y: 0 };

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      pointerTarget.x = (clientX / rect.width) * 2 - 1;
      pointerTarget.y = -(clientY / rect.height) * 2 + 1;
      isPointerInside = true;

      if (isDragging) {
        const deltaX = e.clientX - prevMousePos.x;
        const deltaY = e.clientY - prevMousePos.y;
        dragRotation.y += deltaX * 0.008;
        dragRotation.x = Math.max(-0.4, Math.min(0.4, dragRotation.x + deltaY * 0.005));
        prevMousePos = { x: e.clientX, y: e.clientY };
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onPointerLeave = () => {
      isPointerInside = false;
      isDragging = false;
      pointerTarget.set(0, 0);
    };

    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointerleave', onPointerLeave);

    // 12. Resize Observer
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;

      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);

      const aspect = w / h;
      if (aspect < 0.95) {
        baseCameraPos.z = 14.5 + (0.95 - aspect) * 7.0;
        baseCameraPos.y = 2.2 + (0.95 - aspect) * 1.0;
      } else {
        baseCameraPos.z = 14.5;
        baseCameraPos.y = 2.2;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    // 13. Main Three.js Animation Loop
    const clock = new THREE.Clock();
    let animId = 0;
    let currentNormProgress = completionRateRef.current / 100;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const dt = Math.min(clock.getDelta(), 0.1);
      const elapsed = clock.getElapsedTime();
      const motionFactor = prefersReducedMotion ? 0.25 : 1.0;

      // Real habit completion percentage interpolation
      const targetNorm = Math.max(0, Math.min(100, completionRateRef.current)) / 100;
      currentNormProgress += (targetNorm - currentNormProgress) * Math.min(1, dt * 3.2);

      // Lifetime Island Maturity scaling (based on userXP - does NOT reset when daily habits are 0)
      const lifetimeFactor = Math.min(1, Math.max(0.65, userXPRef.current / 1800));

      if (habitBurstIntensity > 0.001) {
        habitBurstIntensity = Math.max(0, habitBurstIntensity - dt * 1.15);
      }

      // Smooth pointer damping
      pointerSmoothed.x += (pointerTarget.x - pointerSmoothed.x) * Math.min(1, dt * 4.5);
      pointerSmoothed.y += (pointerTarget.y - pointerSmoothed.y) * Math.min(1, dt * 4.5);

      const pointerDist = Math.hypot(pointerSmoothed.x, pointerSmoothed.y);
      const proximityBoost = isPointerInside
        ? Math.max(0, 1 - pointerDist * 0.85) * 0.35
        : 0;

      // 3D Floating Idle Motion + Perspective Tilt & Interactive Drag Rotation
      const floatY = Math.sin(elapsed * 1.15) * (0.24 * motionFactor);
      const idleYaw = Math.sin(elapsed * 0.35) * (0.06 * motionFactor);

      IslandPivot.position.y = floatY;
      IslandPivot.rotation.y = idleYaw + dragRotation.y + pointerSmoothed.x * 0.24 * motionFactor;
      IslandPivot.rotation.x = dragRotation.x - pointerSmoothed.y * 0.14 * motionFactor;
      IslandPivot.rotation.z = -pointerSmoothed.x * 0.06 * motionFactor;

      // Camera Parallax
      camera.position.x = baseCameraPos.x + pointerSmoothed.x * 0.85 * motionFactor;
      camera.position.y = baseCameraPos.y + pointerSmoothed.y * 0.55 * motionFactor;
      camera.position.z = baseCameraPos.z;
      camera.lookAt(0, -0.35 + floatY * 0.2, 0);

      // Monk Breathing
      const breath = Math.sin(elapsed * 1.8) * 0.5 + 0.5;
      monkBreathGroup.position.y = 0.22 + breath * 0.012 * motionFactor;
      monkBreathGroup.scale.set(
        1 + breath * 0.012 * motionFactor,
        1 + breath * 0.015 * motionFactor,
        1 + breath * 0.012 * motionFactor
      );

      // Crystal Illumination tied to real daily completionRate
      const crystalPulse = Math.sin(elapsed * 2.1) * 0.12 + 0.88;
      const progressLightScale = 0.38 + currentNormProgress * 0.92;
      const burstBoost = habitBurstIntensity * 2.6;

      crystalLight.intensity =
        2.8 * progressLightScale * crystalPulse + proximityBoost * 1.4 + burstBoost * 2.4;
      underCyanLight.intensity =
        1.4 * (0.35 + currentNormProgress * 0.85) * crystalPulse + burstBoost * 1.8;

      crystalMaterials.forEach((mat) => {
        mat.emissiveIntensity =
          (0.28 + currentNormProgress * 0.52) * crystalPulse +
          proximityBoost * 0.25 +
          burstBoost * 0.95;
      });

      crystalInnerCores.forEach((mat) => {
        mat.opacity = Math.min(
          1,
          (0.3 + currentNormProgress * 0.45) * crystalPulse + burstBoost * 0.45
        );
      });

      auraSprites.forEach((aura) => {
        const wave = Math.sin(elapsed * aura.speed + aura.phase) * 0.06 + 1.0;
        const scaleFactor =
          (0.68 + currentNormProgress * 0.42 + habitBurstIntensity * 0.38) * wave;
        aura.sprite.scale.set(aura.baseScale * scaleFactor, aura.baseScale * scaleFactor, 1);
        aura.sprite.material.opacity = Math.min(
          1,
          aura.baseOpacity * (0.32 + currentNormProgress * 0.85) * wave +
            habitBurstIntensity * 0.35
        );
      });

      // Cyan Pathways
      const veinPulse = Math.sin(elapsed * 2.4) * 0.15 + 0.85;
      glowVeinMaterials.forEach((item) => {
        item.mat.opacity = Math.min(
          1,
          item.baseOpacity * (0.25 + currentNormProgress * 0.88) * veinPulse +
            habitBurstIntensity * 0.45
        );
      });

      // Tree Growth: Governed by lifetimeProgress so trees do not disappear on new days!
      growthItems.forEach((item) => {
        let targetScale = item.baseScale;
        if (item.minThreshold > 0) {
          const localP = Math.max(0, Math.min(1, (lifetimeFactor - item.minThreshold) / 0.28));
          targetScale = Math.max(0.7, localP) * item.baseScale;
        }
        const currentS = item.obj.scale.x;
        const nextS = currentS + (targetScale - currentS) * Math.min(1, dt * 5.0);
        item.obj.scale.setScalar(nextS);
      });

      swayObjects.forEach((sw) => {
        sw.obj.rotation.z = Math.sin(elapsed * sw.speed + sw.phase) * (sw.amp * motionFactor);
        sw.obj.rotation.x =
          Math.cos(elapsed * (sw.speed * 0.8) + sw.phase) * (sw.amp * 0.7 * motionFactor);
      });

      // Floating Sub-rocks
      floatingSubRocks.forEach((sr) => {
        sr.mesh.position.y =
          sr.baseY + Math.sin(elapsed * sr.speed + sr.phase) * (sr.amp * motionFactor);
        sr.mesh.rotation.y += dt * sr.rotSpeed * motionFactor;
      });

      // Fireflies
      fireflies.forEach((ff) => {
        const currentAngle = ff.baseAngle + elapsed * ff.orbitSpeed * motionFactor;
        ff.sprite.position.x = Math.cos(currentAngle) * ff.radius + pointerSmoothed.x * 0.35;
        ff.sprite.position.z = Math.sin(currentAngle) * ff.radius;
        ff.sprite.position.y =
          ff.baseY + Math.sin(elapsed * ff.bobSpeed + ff.phase) * (ff.bobAmp * motionFactor);

        const visibleFactor =
          currentNormProgress >= ff.threshold
            ? Math.min(1, (currentNormProgress - ff.threshold) / 0.2)
            : 0.22;
        const twinkle = 0.65 + 0.35 * Math.sin(elapsed * 3.2 + ff.phase);
        ff.sprite.material.opacity = visibleFactor * twinkle * 0.9;
        const s = ff.baseScale * (0.7 + 0.3 * twinkle);
        ff.sprite.scale.set(s, s, 1);
      });

      // Rising Stardust
      if (risingDustSystem) {
        const posAttr = risingDustSystem.geometry.attributes.position;
        for (let i = 0; i < risingDustData.length; i++) {
          const dItem = risingDustData[i];
          let py = posAttr.getY(i) + dItem.speedY * dt * (0.55 + currentNormProgress * 0.75);
          if (py > 4.2) py = -3.8;
          const swayX =
            Math.cos(dItem.angle + elapsed * 0.15) * dItem.radius +
            Math.sin(elapsed + dItem.driftPhase) * 0.08;
          const swayZ =
            Math.sin(dItem.angle + elapsed * 0.15) * dItem.radius +
            Math.cos(elapsed + dItem.driftPhase) * 0.08;
          posAttr.setXYZ(i, swayX, py, swayZ);
        }
        posAttr.needsUpdate = true;
        dustMat.opacity = 0.28 + currentNormProgress * 0.52 + habitBurstIntensity * 0.3;
      }

      // Active Completion Torus Ripples
      for (let i = activeRipples.length - 1; i >= 0; i--) {
        const rp = activeRipples[i];
        rp.age += dt;
        const t = rp.age / rp.maxAge;
        if (t >= 1) {
          IslandPivot.remove(rp.mesh);
          rp.mesh.geometry.dispose();
          if (Array.isArray(rp.mesh.material)) {
            rp.mesh.material.forEach((m) => m.dispose());
          } else {
            rp.mesh.material.dispose();
          }
          activeRipples.splice(i, 1);
        } else {
          const easeOut = 1 - Math.pow(1 - t, 3);
          const s = rp.startScale + (rp.endScale - rp.startScale) * easeOut;
          rp.mesh.scale.set(s, s, s);
          (rp.mesh.material as THREE.MeshBasicMaterial).opacity = (1 - t) * 0.9;
        }
      }

      // Active Sparkle Bursts
      for (let i = activeBurstParticles.length - 1; i >= 0; i--) {
        const bp = activeBurstParticles[i];
        bp.age += dt;
        const t = bp.age / bp.maxAge;
        if (t >= 1) {
          IslandPivot.remove(bp.sprite);
          bp.sprite.material.dispose();
          activeBurstParticles.splice(i, 1);
        } else {
          bp.sprite.position.addScaledVector(bp.vel, dt);
          bp.vel.multiplyScalar(0.95);
          bp.sprite.material.opacity = 1 - t;
          const sc = bp.baseScale * (1 - t * 0.5);
          bp.sprite.scale.set(sc, sc, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('pointermove', onPointerMove);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      container.removeEventListener('pointerleave', onPointerLeave);

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.Sprite) {
          if (object.geometry) object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => m.dispose());
          } else if (object.material) {
            object.material.dispose();
          }
        }
      });

      renderer.dispose();
    };
  }, [hasWebGL, prefersReducedMotion]);

  if (!hasWebGL) {
    return <IslandFallback completionRate={completionRate} />;
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[400px] sm:h-[460px] lg:h-[500px] xl:h-[540px] rounded-2xl overflow-hidden bg-gradient-to-b from-[#080914] via-[#06070e] to-[#04050a] border border-violet-500/20 shadow-2xl group select-none flex items-center justify-center cursor-grab active:cursor-grabbing"
    >
      {/* Background Radial Ambiance */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-950/25 via-[#080914]/80 to-[#04050a] pointer-events-none" />

      {/* Floating HUD Badges: Top Left */}
      <div className="absolute top-4 left-4 z-30 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-violet-500/30 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide text-slate-100">
            Monk&apos;s Living Sanctuary
          </span>
          <span className="text-[10px] uppercase font-bold text-violet-300 bg-violet-950/90 px-1.5 py-0.5 rounded border border-violet-500/30">
            Stage {sanctuaryStage}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 pl-1 flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>{completedCount} of {totalCount} rituals completed today</span>
        </p>
      </div>

      {/* Floating HUD Badges: Top Right (Crystal Lumens tied to real completionRate) */}
      <div className="absolute top-4 right-4 z-30 pointer-events-none">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/85 backdrop-blur-md border border-violet-500/30 shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Crystal Lumens</div>
            <div className="text-xs font-extrabold text-violet-300">
              {completionRate}% Charged
            </div>
          </div>
        </div>
      </div>

      {/* Native WebGL Canvas for Procedural 3D Island */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block outline-none"
        aria-label="3D Interactive Monk Sanctuary Canvas"
      />

      {/* Floating HUD Control / Hint Bar at Bottom */}
      <div className="absolute bottom-3 inset-x-3 z-30 flex items-center justify-between text-[11px] text-slate-400 px-3.5 py-1.5 rounded-xl bg-slate-950/70 backdrop-blur-md border border-white/5 pointer-events-none">
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-violet-400" />
          <span className="hidden sm:inline">Move cursor or drag to experience 3D sanctuary</span>
          <span className="sm:hidden">Interactive 3D Sanctuary</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
            <ShieldCheck className="w-3 h-3" /> Real-time Habit Sync
          </span>
          <span className="hidden sm:inline text-slate-600">•</span>
          <span className="hidden sm:inline text-[10px] text-slate-300 flex items-center gap-1">
            <Eye className="w-3 h-3 text-cyan-400" /> 60 FPS Three.js
          </span>
        </div>
      </div>
    </div>
  );
};
