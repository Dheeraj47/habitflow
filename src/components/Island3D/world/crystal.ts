import * as THREE from 'three';
import { createHaloTexture } from '../../../utils/proceduralTextures';

/**
 * High-Fidelity Amethyst Quartz Crystal Cluster & Celestial Resonance:
 * - Natural geode cluster of faceted hexagonal quartz crystals with authentic rhombohedral terminations
 * - Darker violet chiseled facet edges with translucent refractive lavender quartz interiors
 * - Inner luminous lavender core emitting soft volumetric inner glow through transmission
 * - Basal druse quartz crystal needles anchoring the formation into the bedrock
 * - Violet point light casting rich illumination onto the monk and mossy terrain
 * - Floating celestial nebula halo and progress-linked resonance pulsing
 */

export interface CrystalCluster {
  group: THREE.Group;
  crystalLight: THREE.PointLight;
  centralCrystal: THREE.Mesh;
  shardMeshes: THREE.Mesh[];
  edgeMeshes: THREE.LineSegments[];
  haloMesh: THREE.Mesh;
  crystalMaterials: THREE.MeshPhysicalMaterial[];
  updateAnimation: (time: number, progressRatio: number, stageIntensity: number) => void;
}

/**
 * Generates an authentic hexagonal quartz crystal with asymmetric rhombohedral terminations.
 * In natural amethyst, three alternating faces (major r-faces) are steeper and broader,
 * while the other three (minor z-faces) are slightly smaller and shallower.
 */
function createNaturalQuartzGeometry(
  radius: number,
  height: number,
  tipRatio: number = 0.38,
  asymmetry: number = 0.15
): THREE.BufferGeometry {
  const segments = 6;
  const bodyH = height * (1 - tipRatio);
  const tipH = height * tipRatio;

  // We construct explicit triangular and quad faces with flat facet normals
  const positions: number[] = [];
  const normals: number[] = [];

  const basePoints: THREE.Vector3[] = [];
  const midPoints: THREE.Vector3[] = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    // Base ring
    basePoints.push(new THREE.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    // Prismatic prism mid ring
    const taper = 0.88 + ((i % 2 === 0) ? 0.04 : -0.04);
    midPoints.push(
      new THREE.Vector3(
        Math.cos(angle) * radius * taper,
        bodyH,
        Math.sin(angle) * radius * taper
      )
    );
  }

  // Apex tip with natural crystal offset
  const apex = new THREE.Vector3(asymmetry * radius * 0.4, bodyH + tipH, -asymmetry * radius * 0.3);

  function addTriangle(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3) {
    const edgeA = new THREE.Vector3().subVectors(p2, p1);
    const edgeB = new THREE.Vector3().subVectors(p3, p1);
    const faceNormal = new THREE.Vector3().crossVectors(edgeA, edgeB).normalize();

    positions.push(p1.x, p1.y, p1.z);
    positions.push(p2.x, p2.y, p2.z);
    positions.push(p3.x, p3.y, p3.z);

    for (let k = 0; k < 3; k++) {
      normals.push(faceNormal.x, faceNormal.y, faceNormal.z);
    }
  }

  function addQuad(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, p4: THREE.Vector3) {
    addTriangle(p1, p2, p3);
    addTriangle(p1, p3, p4);
  }

  // 1. Prismatic body faces (6 rectangular facet columns)
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    addQuad(basePoints[i], basePoints[next], midPoints[next], midPoints[i]);
  }

  // 2. Rhombohedral termination facet caps
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    addTriangle(midPoints[i], midPoints[next], apex);
  }

  // 3. Bottom seal cap
  const baseCenter = new THREE.Vector3(0, 0, 0);
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    addTriangle(baseCenter, basePoints[next], basePoints[i]);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  return geo;
}

export function buildCrystalCluster(isSoftwareGl: boolean = false): CrystalCluster {
  const group = new THREE.Group();
  group.name = 'crystalCluster';
  group.position.set(0, 0.28, -1.25);

  const crystalMaterials: THREE.MeshPhysicalMaterial[] = [];
  const shardMeshes: THREE.Mesh[] = [];
  const edgeMeshes: THREE.LineSegments[] = [];

  // -------------------------------------------------------------
  // Materials: Deep Violet Amethyst with Refractive Transmission
  // -------------------------------------------------------------
  function makeAmethystMaterial(
    colorHex: number,
    emissiveHex: number,
    opacityVal: number = 0.95
  ) {
    const mat = new THREE.MeshPhysicalMaterial({
      color: colorHex,
      emissive: emissiveHex,
      emissiveIntensity: 0.35,
      roughness: 0.14,
      metalness: 0.04,
      clearcoat: 1.0,
      clearcoatRoughness: 0.06,
      transparent: true,
      opacity: isSoftwareGl ? opacityVal : 1.0,
      transmission: isSoftwareGl ? 0.0 : 0.82,
      ior: 1.54,
      thickness: 1.6,
      attenuationColor: new THREE.Color(0x350d68),
      attenuationDistance: 1.25,
      flatShading: true,
    });
    crystalMaterials.push(mat);
    return mat;
  }

  // Dark royal amethyst for outer spires & facets
  const royalAmethystMat = makeAmethystMaterial(0x5a23a3, 0x320f66, 0.96);
  // Translucent lavender for mid spires
  const lavenderQuartzMat = makeAmethystMaterial(0x7c49cf, 0x47188a, 0.92);
  // Luminous inner core material
  const innerCoreMat = new THREE.MeshPhysicalMaterial({
    color: 0xc49eff,
    emissive: 0x7c3de3,
    emissiveIntensity: 0.65,
    roughness: 0.2,
    metalness: 0.0,
    transparent: true,
    opacity: 0.85,
    flatShading: true,
  });
  crystalMaterials.push(innerCoreMat);

  // Chiseled dark violet facet edge line material
  const edgeMat = new THREE.LineBasicMaterial({
    color: 0x340a6b,
    transparent: true,
    opacity: 0.85,
  });

  // Helper to construct crystal spire with dark facet outlines
  function addCrystalSpire(
    radius: number,
    height: number,
    tipRatio: number,
    asym: number,
    mat: THREE.MeshPhysicalMaterial,
    pos: THREE.Vector3,
    rot: [number, number, number],
    name: string
  ): THREE.Mesh {
    const geo = createNaturalQuartzGeometry(radius, height, tipRatio, asym);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = name;
    mesh.position.copy(pos);
    mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    shardMeshes.push(mesh);

    // Dark facet edge lines for chiseled crystal readability
    const edgesGeo = new THREE.EdgesGeometry(geo, 15);
    const lineMesh = new THREE.LineSegments(edgesGeo, edgeMat);
    lineMesh.position.copy(pos);
    lineMesh.rotation.set(rot[0], rot[1], rot[2]);
    group.add(lineMesh);
    edgeMeshes.push(lineMesh);

    return mesh;
  }

  // -------------------------------------------------------------
  // 1. Central Hero Amethyst Spire
  // -------------------------------------------------------------
  const centralCrystal = addCrystalSpire(
    0.68,
    3.4,
    0.34,
    0.16,
    royalAmethystMat,
    new THREE.Vector3(0, 0, 0),
    [0.04, 0.12, 0.02],
    'centralCrystal'
  );

  // Inner luminous lavender core inside central spire
  const innerCoreGeo = createNaturalQuartzGeometry(0.38, 2.7, 0.32, 0.0);
  const innerCoreMesh = new THREE.Mesh(innerCoreGeo, innerCoreMat);
  innerCoreMesh.position.set(0, 0.12, 0);
  innerCoreMesh.rotation.set(0.04, 0.12, 0.02);
  group.add(innerCoreMesh);

  // -------------------------------------------------------------
  // 2. Clustered Secondary & Flanking Quartz Spires
  // -------------------------------------------------------------
  const secondarySpireConfigs = [
    // Twin rear-right tall spire
    { r: 0.46, h: 2.6, tip: 0.35, asym: 0.18, mat: lavenderQuartzMat, pos: new THREE.Vector3(0.68, 0, -0.22), rot: [0.08, -0.32, -0.16] as [number, number, number] },
    // Twin rear-left tall spire
    { r: 0.44, h: 2.5, tip: 0.36, asym: -0.15, mat: lavenderQuartzMat, pos: new THREE.Vector3(-0.65, 0, -0.26), rot: [0.12, 0.28, 0.18] as [number, number, number] },
    // Flanking left angled crystal
    { r: 0.38, h: 1.9, tip: 0.38, asym: 0.14, mat: royalAmethystMat, pos: new THREE.Vector3(-1.12, 0, 0.14), rot: [0.22, 0.52, 0.38] as [number, number, number] },
    // Flanking right angled crystal
    { r: 0.40, h: 2.0, tip: 0.38, asym: -0.14, mat: royalAmethystMat, pos: new THREE.Vector3(1.15, 0, 0.12), rot: [0.20, -0.46, -0.36] as [number, number, number] },
    // Front-left forward guard crystal
    { r: 0.30, h: 1.45, tip: 0.40, asym: 0.12, mat: lavenderQuartzMat, pos: new THREE.Vector3(-0.58, 0, 0.48), rot: [0.34, 0.24, 0.16] as [number, number, number] },
    // Front-right forward guard crystal
    { r: 0.32, h: 1.55, tip: 0.40, asym: -0.12, mat: lavenderQuartzMat, pos: new THREE.Vector3(0.62, 0, 0.46), rot: [0.30, -0.28, -0.15] as [number, number, number] },
  ];

  secondarySpireConfigs.forEach((cfg, idx) => {
    addCrystalSpire(
      cfg.r,
      cfg.h,
      cfg.tip,
      cfg.asym,
      cfg.mat,
      cfg.pos,
      cfg.rot,
      `crystalSpire_${idx}`
    );
  });

  // -------------------------------------------------------------
  // 3. Basal Druse Quartz Needles (Natural Crystal Bedrock Cluster)
  // -------------------------------------------------------------
  const drusePositions = [
    { pos: new THREE.Vector3(-0.25, 0, 0.65), rot: [0.45, 0.1, 0.25], s: 0.32 },
    { pos: new THREE.Vector3(0.28, 0, 0.68), rot: [0.42, -0.15, -0.22], s: 0.34 },
    { pos: new THREE.Vector3(-0.95, 0, -0.55), rot: [-0.2, 0.6, 0.35], s: 0.28 },
    { pos: new THREE.Vector3(0.98, 0, -0.52), rot: [-0.18, -0.55, -0.32], s: 0.29 },
    { pos: new THREE.Vector3(-0.15, 0, -0.78), rot: [-0.35, 0.1, 0.12], s: 0.36 },
    { pos: new THREE.Vector3(0.18, 0, -0.76), rot: [-0.32, -0.12, -0.14], s: 0.35 },
  ];

  drusePositions.forEach((dp, idx) => {
    const miniGeo = createNaturalQuartzGeometry(0.22, 1.1, 0.4, 0.1);
    const miniMesh = new THREE.Mesh(miniGeo, royalAmethystMat);
    miniMesh.name = `druseShard_${idx}`;
    miniMesh.position.copy(dp.pos);
    miniMesh.rotation.set(dp.rot[0], dp.rot[1], dp.rot[2]);
    miniMesh.scale.setScalar(dp.s);
    miniMesh.castShadow = true;
    group.add(miniMesh);
    shardMeshes.push(miniMesh);
  });

  // -------------------------------------------------------------
  // 4. Ground Amethyst Formations on Outer Island Rim
  // -------------------------------------------------------------
  const rimFormations = [
    { pos: new THREE.Vector3(-3.1, 0.12, 0.35), rot: [0.35, 0.2, 0.3], s: 0.36 },
    { pos: new THREE.Vector3(-3.3, 0.09, 0.05), rot: [0.18, 0.6, 0.45], s: 0.26 },
    { pos: new THREE.Vector3(3.1, 0.12, 0.25), rot: [0.28, -0.3, -0.35], s: 0.34 },
    { pos: new THREE.Vector3(3.3, 0.08, -0.15), rot: [0.12, -0.5, -0.28], s: 0.24 },
  ];

  rimFormations.forEach((rf, idx) => {
    const geo = createNaturalQuartzGeometry(0.26, 1.2, 0.38, 0.12);
    const mesh = new THREE.Mesh(geo, royalAmethystMat);
    mesh.name = `rimCrystal_${idx}`;
    mesh.position.copy(rf.pos);
    mesh.rotation.set(rf.rot[0], rf.rot[1], rf.rot[2]);
    mesh.scale.setScalar(rf.s);
    mesh.castShadow = true;
    group.add(mesh);
    shardMeshes.push(mesh);
  });

  // -------------------------------------------------------------
  // 5. Violet Crystal Point Light (Illuminating Monk & Terrain)
  // -------------------------------------------------------------
  const crystalLight = new THREE.PointLight(0xa568ff, 3.2, 12, 1.35);
  crystalLight.name = 'crystalLight';
  crystalLight.position.set(0, 1.9, 0.4);
  crystalLight.castShadow = !isSoftwareGl;
  crystalLight.shadow.bias = -0.002;
  group.add(crystalLight);

  // -------------------------------------------------------------
  // 6. Floating Celestial Nebula Swirl Halo
  // -------------------------------------------------------------
  const haloGeo = new THREE.PlaneGeometry(5.4, 5.4);
  const haloTex = createHaloTexture();
  const haloMat = new THREE.MeshBasicMaterial({
    map: haloTex,
    transparent: true,
    opacity: 0.68,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const haloMesh = new THREE.Mesh(haloGeo, haloMat);
  haloMesh.name = 'crystalHalo';
  haloMesh.position.set(0, 2.0, -0.3);
  group.add(haloMesh);

  // -------------------------------------------------------------
  // 7. Animation update
  // -------------------------------------------------------------
  const updateAnimation = (time: number, progressRatio: number, stageIntensity: number) => {
    const pulseSpeed = 1.1 + progressRatio * 1.5;
    const pulse = 0.5 + 0.5 * Math.sin(time * pulseSpeed);

    // Emissive modulation keeping deep violet richness rather than blown-out neon
    const emissiveBase = 0.28 + stageIntensity * 0.42 + progressRatio * 0.4;
    const currentEmissive = emissiveBase * (0.86 + 0.26 * pulse);

    crystalMaterials.forEach((m) => {
      m.emissiveIntensity = currentEmissive;
    });

    // Violet light illumination casting on monk and terrain
    crystalLight.intensity = (2.2 + stageIntensity * 2.2 + progressRatio * 2.8) * (0.9 + 0.2 * pulse);

    // Floating celestial halo rotation & breathing
    haloMesh.rotation.z = time * 0.06;
    const haloScale = (0.94 + stageIntensity * 0.16) * (1.0 + 0.04 * Math.sin(time * 1.5));
    haloMesh.scale.set(haloScale, haloScale, 1.0);
    haloMat.opacity = Math.min(0.82, 0.32 + stageIntensity * 0.26 + progressRatio * 0.28 + 0.08 * pulse);
  };

  return {
    group,
    crystalLight,
    centralCrystal,
    shardMeshes,
    edgeMeshes,
    haloMesh,
    crystalMaterials,
    updateAnimation,
  };
}
