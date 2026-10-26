import * as THREE from 'three';
import {
  createMossTexture,
  createRockBumpTexture,
  createMossBumpTexture,
} from '../../../utils/proceduralTextures';

/**
 * High-Fidelity Floating Island Sanctuary:
 * - Upper Terrain: Organically varied terrain featuring undulating moss hummocks,
 *   exposed moist loam soil patches, smooth river pebbles, wild fern fronds, grass tufts,
 *   gnarled surface roots, and layered slate boulders.
 * - Rocky Underside: Deep geological silhouette with stepped basalt strata shelves,
 *   tectonic fractures, crevices, and a craggy tapering stalactite tip descending into the void.
 * - Cyan Energy Fissures: Multi-branching bioluminescent fissures embedded in the rock crevices
 *   with dual-core emissive radiance and local light spill.
 * - Floating Satellite Debris: Irregular stone fragments levitating with gentle organic buoyancy.
 */

export interface IslandComponents {
  islandGroup: THREE.Group;
  terrainMesh: THREE.Mesh;
  rockUndersideMesh: THREE.Mesh;
  fissureMeshGroup: THREE.Group;
  satelliteRocksGroup: THREE.Group;
  embeddedBouldersGroup: THREE.Group;
  pebblesGroup: THREE.Group;
  rootsGroup: THREE.Group;
  foliageDetailGroup: THREE.Group;
  fissureMaterials: THREE.MeshBasicMaterial[];
}

export function buildFloatingIsland(): IslandComponents {
  const islandGroup = new THREE.Group();
  islandGroup.name = 'floatingIsland';

  const bumpTex = createRockBumpTexture();
  const mossTex = createMossTexture();
  const mossBumpTex = createMossBumpTexture();

  // -------------------------------------------------------------
  // 1. Organically Varied Upper Terrain (Moss Hummocks & Loam Clearing)
  // -------------------------------------------------------------
  const radius = 3.9;
  const segmentsRadial = 64;
  const segmentsRing = 40;

  const terrainGeo = new THREE.RingGeometry(0.01, radius, segmentsRadial, segmentsRing);
  terrainGeo.rotateX(-Math.PI / 2);

  const posAttr = terrainGeo.attributes.position;
  const vertex = new THREE.Vector3();
  const terrainColors: number[] = [];

  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);
    const baseDist = Math.hypot(vertex.x, vertex.z);
    const angle = Math.atan2(vertex.z, vertex.x);

    // Natural irregular boundary silhouette matching underside exactly
    const boundaryShape =
      1.0 +
      0.14 * Math.sin(angle * 3.0 + 0.4) +
      0.09 * Math.cos(angle * 5.0 - 0.6) +
      0.05 * Math.sin(angle * 8.0);

    // Scale X and Z so the perimeter organically curves and exactly matches the rocky underside
    vertex.x *= boundaryShape;
    vertex.z *= boundaryShape;

    const normDist = Math.min(1.0, baseDist / radius);

    // Organic elevation sculpting:
    // 1. Left raised mossy bank for the main ancient bonsai
    const leftDist = Math.hypot(vertex.x + 1.9, vertex.z + 0.5);
    const leftBerm = Math.max(0, 1 - leftDist / 2.3) * 0.45;

    // 2. Right rolling moss hummock
    const rightDist = Math.hypot(vertex.x - 1.9, vertex.z + 0.4);
    const rightBerm = Math.max(0, 1 - rightDist / 2.0) * 0.32;

    // 3. Rear crystal elevation bedrock shelf
    const backDist = Math.hypot(vertex.x, vertex.z + 1.35);
    const backMound = Math.max(0, 1 - backDist / 2.1) * 0.38;

    // 4. Natural rolling moss hummocks and micro-undulations
    const hummocks =
      Math.sin(vertex.x * 2.8 + 0.5) * Math.cos(vertex.z * 2.8) * 0.08 +
      Math.sin(vertex.x * 5.5) * Math.cos(vertex.z * 5.2) * 0.035;

    let y = leftBerm + rightBerm + backMound + hummocks;

    // 5. Central earthen meditation clearing (where monk sits)
    const centerDist = Math.hypot(vertex.x, vertex.z - 0.25);
    if (centerDist < 1.45) {
      // Gently flatten clearing for stable meditation seating
      y = y * 0.16;
    }

    // 6. Seamless natural rim roll down to meet the craggy underside
    if (normDist > 0.88) {
      const edgeFactor = (normDist - 0.88) / 0.12;
      y -= edgeFactor * edgeFactor * 0.25;
    }

    vertex.y = y;
    posAttr.setXYZ(i, vertex.x, vertex.y, vertex.z);

    // Natural soil & moss vertex color modulation:
    // - Central clearing: rich warm exposed loam soil (browns / ochres)
    // - Rolling berms: vibrant forest moss (emerald / olive)
    // - Cliff edge: weathered slate rock transition
    let r = 0.95;
    let g = 1.05;
    let b = 0.95;

    // Central loam path tint
    if (centerDist < 1.4) {
      const loamFactor = 1.0 - centerDist / 1.4;
      r = THREE.MathUtils.lerp(r, 0.72, loamFactor * 0.55);
      g = THREE.MathUtils.lerp(g, 0.62, loamFactor * 0.55);
      b = THREE.MathUtils.lerp(b, 0.48, loamFactor * 0.55);
    }

    // Crest highlights on moss hummocks
    const crest = Math.max(0, Math.min(1, (y - 0.1) * 2.2)) * 0.12;
    r += crest * 0.8;
    g += crest * 1.1;
    b += crest * 0.7;

    // Cliff rim stone transition
    if (normDist > 0.88) {
      const edgeRock = (normDist - 0.88) / 0.12;
      r = THREE.MathUtils.lerp(r, 0.52, edgeRock);
      g = THREE.MathUtils.lerp(g, 0.56, edgeRock);
      b = THREE.MathUtils.lerp(b, 0.62, edgeRock);
    }

    terrainColors.push(r, g, b);
  }

  terrainGeo.setAttribute('color', new THREE.Float32BufferAttribute(terrainColors, 3));

  // Planar Cartesian UV mapping to avoid polar distortion
  const uvAttr = terrainGeo.attributes.uv;
  for (let i = 0; i < posAttr.count; i++) {
    vertex.fromBufferAttribute(posAttr, i);
    const u = vertex.x / (radius * 2.3) + 0.5;
    const v = vertex.z / (radius * 2.3) + 0.5;
    uvAttr.setXY(i, u, v);
  }
  uvAttr.needsUpdate = true;

  terrainGeo.computeVertexNormals();

  const terrainMat = new THREE.MeshStandardMaterial({
    map: mossTex,
    bumpMap: mossBumpTex,
    bumpScale: 0.03,
    roughness: 0.86,
    metalness: 0.03,
    vertexColors: true,
  });

  const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
  terrainMesh.name = 'terrainMesh';
  terrainMesh.receiveShadow = true;
  terrainMesh.castShadow = true;
  islandGroup.add(terrainMesh);

  // -------------------------------------------------------------
  // 2. Sculpted Rocky Underside (Layered Geological Crags & Strata)
  // -------------------------------------------------------------
  const undersideHeight = 5.3;
  const undersideRings = 28;
  const undersideRadSegments = 64;

  // openEnded: true ensures no top cap pokes through the upper terrain
  const undersideGeo = new THREE.CylinderGeometry(
    3.9,
    0.08,
    undersideHeight,
    undersideRadSegments,
    undersideRings,
    true
  );
  undersideGeo.translate(0, -undersideHeight * 0.5 - 0.24, 0);

  const uPos = undersideGeo.attributes.position;
  const uColors: number[] = [];

  for (let i = 0; i < uPos.count; i++) {
    vertex.fromBufferAttribute(uPos, i);
    const depthRatio = Math.max(0, Math.min(1, -vertex.y / undersideHeight));
    const angle = Math.atan2(vertex.z, vertex.x);

    // Matching boundary contour
    const boundaryShape =
      1.0 +
      0.14 * Math.sin(angle * 3.0 + 0.4) +
      0.09 * Math.cos(angle * 5.0 - 0.6) +
      0.05 * Math.sin(angle * 8.0);

    // Geological layers:
    // 1. Stepped horizontal basalt strata shelves
    const strataLayer = Math.sin(vertex.y * 5.4) * 0.16;
    // 2. Deep vertical tectonic cracks & clefts
    const cleft1 = Math.sin(angle * 4.0 + vertex.y * 0.55) * 0.24;
    const cleft2 = Math.cos(angle * 7.0 - vertex.y * 0.85) * 0.15;
    // 3. Craggy overhangs and weathered rock bulges
    const overhang = Math.sin(vertex.y * 2.3 + angle * 2.2) * 0.19;

    // Tapering profile: broad in upper 35%, then sharp tapering stalactite
    let taper = Math.pow(Math.max(0, 1 - depthRatio), 0.72);
    if (depthRatio > 0.8) {
      taper *= 0.74; // needle stalactite tip
    }

    // Blend crags in below the rim so rim perfectly seals against terrain edge
    const cragBlend = Math.min(1.0, depthRatio * 2.8);
    const combinedCrags = (strataLayer + cleft1 + cleft2 + overhang) * cragBlend;

    const radScale = boundaryShape * taper + combinedCrags;

    vertex.x *= Math.max(0.06, radScale);
    vertex.z *= Math.max(0.06, radScale);

    // Tip crag jitter
    if (depthRatio > 0.92) {
      vertex.x += Math.sin(vertex.y * 12.0) * 0.05;
      vertex.z += Math.cos(vertex.y * 12.0) * 0.05;
    }

    uPos.setXYZ(i, vertex.x, vertex.y, vertex.z);

    // Weathered charcoal & slate rock colors with subtle cool cyan/blue bounce tint
    const shade = 0.35 + Math.random() * 0.08 + (1 - depthRatio) * 0.15;
    uColors.push(shade * 0.86, shade * 0.94, shade * 1.1);
  }

  undersideGeo.setAttribute('color', new THREE.Float32BufferAttribute(uColors, 3));
  undersideGeo.computeVertexNormals();

  const rockMat = new THREE.MeshStandardMaterial({
    color: 0x76808e,
    vertexColors: true,
    bumpMap: bumpTex,
    bumpScale: 0.18,
    roughness: 0.90,
    metalness: 0.1,
    flatShading: true,
  });

  const rockUndersideMesh = new THREE.Mesh(undersideGeo, rockMat);
  rockUndersideMesh.name = 'rockUndersideMesh';
  rockUndersideMesh.receiveShadow = true;
  rockUndersideMesh.castShadow = true;
  islandGroup.add(rockUndersideMesh);

  // -------------------------------------------------------------
  // 3. Glowing Cyan Energy Fissures on Underside Crags
  // -------------------------------------------------------------
  const fissureMeshGroup = new THREE.Group();
  fissureMeshGroup.name = 'fissureMeshGroup';
  const fissureMaterials: THREE.MeshBasicMaterial[] = [];

  const fissurePaths = [
    // Front prominent vertical/branching fissure (visible from overview camera)
    [
      new THREE.Vector3(0.35, -0.35, 2.7),
      new THREE.Vector3(0.12, -0.95, 2.4),
      new THREE.Vector3(0.58, -1.6, 1.95),
      new THREE.Vector3(0.25, -2.3, 1.45),
      new THREE.Vector3(0.48, -3.1, 0.95),
      new THREE.Vector3(0.1, -4.0, 0.42),
      new THREE.Vector3(0.02, -4.8, 0.12),
    ],
    // Left-front branch
    [
      new THREE.Vector3(-1.1, -0.45, 2.4),
      new THREE.Vector3(-1.5, -1.15, 1.95),
      new THREE.Vector3(-1.05, -1.8, 1.5),
      new THREE.Vector3(-1.35, -2.6, 1.0),
      new THREE.Vector3(-0.55, -3.5, 0.52),
    ],
    // Right-front branch
    [
      new THREE.Vector3(2.0, -0.45, 1.7),
      new THREE.Vector3(1.7, -1.15, 1.45),
      new THREE.Vector3(2.1, -1.85, 1.0),
      new THREE.Vector3(1.35, -2.65, 0.68),
      new THREE.Vector3(0.65, -3.55, 0.32),
    ],
    // Left-back fissure
    [
      new THREE.Vector3(-2.5, -0.4, -0.2),
      new THREE.Vector3(-2.1, -1.2, 0.18),
      new THREE.Vector3(-1.6, -2.2, 0.38),
      new THREE.Vector3(-0.9, -3.3, 0.22),
    ],
    // Right-back fissure
    [
      new THREE.Vector3(2.4, -0.4, -0.4),
      new THREE.Vector3(1.9, -1.3, -0.1),
      new THREE.Vector3(1.25, -2.35, 0.28),
      new THREE.Vector3(0.6, -3.4, 0.18),
    ],
  ];

  fissurePaths.forEach((pts, idx) => {
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.054, 8, false);

    const mat = new THREE.MeshBasicMaterial({
      color: 0x55ffff,
      transparent: true,
      opacity: 0.96,
    });
    fissureMaterials.push(mat);

    const tubeMesh = new THREE.Mesh(tubeGeo, mat);
    tubeMesh.name = `fissureTube_${idx}`;
    fissureMeshGroup.add(tubeMesh);

    // Soft cyan bioluminescent glow sheath
    const outerGeo = new THREE.TubeGeometry(curve, 36, 0.15, 8, false);
    const outerMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.42,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const outerMesh = new THREE.Mesh(outerGeo, outerMat);
    fissureMeshGroup.add(outerMesh);
  });

  islandGroup.add(fissureMeshGroup);

  // -------------------------------------------------------------
  // 4. Irregular Layered Stone Formations & Embedded Boulders
  // -------------------------------------------------------------
  const embeddedBouldersGroup = new THREE.Group();
  embeddedBouldersGroup.name = 'embeddedBouldersGroup';

  const boulderGeo = new THREE.DodecahedronGeometry(1, 1);
  const boulderMat = new THREE.MeshStandardMaterial({
    color: 0x2e333b,
    bumpMap: bumpTex,
    bumpScale: 0.14,
    roughness: 0.94,
    metalness: 0.1,
    flatShading: true,
  });

  const rocksData = [
    // Layered rock shelf supporting left bonsai
    { pos: new THREE.Vector3(-1.85, 0.28, -0.5), scale: new THREE.Vector3(0.95, 0.48, 0.75), rot: [0.2, 0.5, -0.1] },
    { pos: new THREE.Vector3(-1.35, 0.22, -0.85), scale: new THREE.Vector3(0.65, 0.38, 0.52), rot: [-0.1, 1.2, 0.3] },
    { pos: new THREE.Vector3(-2.25, 0.2, -0.15), scale: new THREE.Vector3(0.55, 0.35, 0.45), rot: [0.3, 0.2, 0.2] },
    // Stones flanking crystal cluster
    { pos: new THREE.Vector3(-0.9, 0.24, -1.25), scale: new THREE.Vector3(0.54, 0.36, 0.46), rot: [0.3, -0.5, 0.1] },
    { pos: new THREE.Vector3(0.85, 0.24, -1.25), scale: new THREE.Vector3(0.56, 0.38, 0.48), rot: [-0.2, 0.8, -0.2] },
    // Right rock formation near sapling
    { pos: new THREE.Vector3(1.85, 0.22, -0.4), scale: new THREE.Vector3(0.68, 0.38, 0.55), rot: [0.1, -0.7, 0.3] },
    { pos: new THREE.Vector3(2.25, 0.18, 0.2), scale: new THREE.Vector3(0.48, 0.3, 0.4), rot: [0.4, 0.3, -0.1] },
  ];

  rocksData.forEach((d) => {
    const rock = new THREE.Mesh(boulderGeo, boulderMat);
    rock.position.copy(d.pos);
    rock.scale.copy(d.scale);
    rock.rotation.set(d.rot[0], d.rot[1], d.rot[2]);
    rock.castShadow = true;
    rock.receiveShadow = true;
    embeddedBouldersGroup.add(rock);
  });

  islandGroup.add(embeddedBouldersGroup);

  // -------------------------------------------------------------
  // 5. Smooth River Pebbles & Natural Stepping Stones
  // -------------------------------------------------------------
  const pebblesGroup = new THREE.Group();
  pebblesGroup.name = 'riverPebbles';

  const pebbleMat = new THREE.MeshStandardMaterial({
    color: 0x4a4f58,
    roughness: 0.72,
    metalness: 0.08,
  });

  const pebbleGeo = new THREE.DodecahedronGeometry(0.12, 1);
  pebbleGeo.scale(1.3, 0.55, 1.0);

  const pebblePositions = [
    // Stepping stones around clearing edge
    { pos: new THREE.Vector3(-0.85, 0.08, 0.95), s: 1.3, rot: 0.3 },
    { pos: new THREE.Vector3(0.9, 0.08, 0.9), s: 1.25, rot: -0.4 },
    { pos: new THREE.Vector3(0.08, 0.06, 1.35), s: 1.2, rot: 0.1 },
    { pos: new THREE.Vector3(-0.4, 0.05, 1.15), s: 1.0, rot: 0.8 },
    { pos: new THREE.Vector3(0.5, 0.05, 1.12), s: 0.95, rot: -0.6 },
    // Small pebbles clustered along loam border
    { pos: new THREE.Vector3(-0.65, 0.06, 0.65), s: 0.65, rot: 1.1 },
    { pos: new THREE.Vector3(-0.75, 0.07, 0.52), s: 0.5, rot: 0.2 },
    { pos: new THREE.Vector3(0.68, 0.06, 0.62), s: 0.6, rot: -0.8 },
    { pos: new THREE.Vector3(0.78, 0.07, 0.48), s: 0.48, rot: 0.4 },
    { pos: new THREE.Vector3(-0.25, 0.05, 1.45), s: 0.7, rot: 0.5 },
    { pos: new THREE.Vector3(0.32, 0.05, 1.42), s: 0.62, rot: -0.3 },
  ];

  pebblePositions.forEach((p) => {
    const pebble = new THREE.Mesh(pebbleGeo, pebbleMat);
    pebble.position.copy(p.pos);
    pebble.scale.setScalar(p.s);
    pebble.rotation.y = p.rot;
    pebble.castShadow = true;
    pebble.receiveShadow = true;
    pebblesGroup.add(pebble);
  });

  islandGroup.add(pebblesGroup);

  // -------------------------------------------------------------
  // 6. Gnarled Tree Roots Spreading Across Stone & Moss
  // -------------------------------------------------------------
  const rootsGroup = new THREE.Group();
  rootsGroup.name = 'treeRoots';

  const rootBarkMat = new THREE.MeshStandardMaterial({
    color: 0x322216,
    roughness: 0.95,
    metalness: 0.04,
  });

  const rootCurves = [
    // Main root arching over the boulder down into moss
    [
      new THREE.Vector3(-1.85, 0.45, -0.5),
      new THREE.Vector3(-1.5, 0.32, -0.3),
      new THREE.Vector3(-1.25, 0.18, -0.05),
      new THREE.Vector3(-1.1, 0.08, 0.25),
    ],
    // Secondary root toward clearing
    [
      new THREE.Vector3(-1.85, 0.42, -0.5),
      new THREE.Vector3(-1.7, 0.28, -0.15),
      new THREE.Vector3(-1.55, 0.14, 0.2),
      new THREE.Vector3(-1.4, 0.08, 0.45),
    ],
    // Rear root clinging to boulder
    [
      new THREE.Vector3(-1.85, 0.42, -0.5),
      new THREE.Vector3(-2.1, 0.35, -0.8),
      new THREE.Vector3(-2.3, 0.22, -1.05),
    ],
  ];

  rootCurves.forEach((pts) => {
    const curve = new THREE.CatmullRomCurve3(pts);
    const rGeo = new THREE.TubeGeometry(curve, 18, 0.048, 8, false);
    const rMesh = new THREE.Mesh(rGeo, rootBarkMat);
    rMesh.castShadow = true;
    rMesh.receiveShadow = true;
    rootsGroup.add(rMesh);
  });

  islandGroup.add(rootsGroup);

  // -------------------------------------------------------------
  // 7. Wild Fern Fronds & Natural Grass Tufts
  // -------------------------------------------------------------
  const foliageDetailGroup = new THREE.Group();
  foliageDetailGroup.name = 'foliageDetails';

  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x387834,
    roughness: 0.82,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  const fernMat = new THREE.MeshStandardMaterial({
    color: 0x296928,
    roughness: 0.78,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  // Create delicate fern frond
  function createFernPlant(): THREE.Group {
    const plant = new THREE.Group();
    const frondCount = 6;

    for (let f = 0; f < frondCount; f++) {
      const frondGroup = new THREE.Group();
      const angle = (f / frondCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;

      // Stem arch
      const stemCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0.08, 0.12, 0.02),
        new THREE.Vector3(0.22, 0.18, 0.04),
        new THREE.Vector3(0.38, 0.16, 0.06),
      ]);
      const stemGeo = new THREE.TubeGeometry(stemCurve, 10, 0.012, 4, false);
      const stemMesh = new THREE.Mesh(stemGeo, fernMat);
      frondGroup.add(stemMesh);

      // Pinnae (leaflets) along stem
      const leafletGeo = new THREE.PlaneGeometry(0.08, 0.035);
      leafletGeo.rotateY(Math.PI / 2);

      for (let p = 1; p <= 4; p++) {
        const t = p / 5;
        const pt = stemCurve.getPoint(t);
        const lLeft = new THREE.Mesh(leafletGeo, fernMat);
        lLeft.position.set(pt.x, pt.y, pt.z + 0.03);
        lLeft.rotation.set(0.2, 0.3, -0.2);
        lLeft.scale.setScalar(1.0 - t * 0.4);
        frondGroup.add(lLeft);

        const lRight = new THREE.Mesh(leafletGeo, fernMat);
        lRight.position.set(pt.x, pt.y, pt.z - 0.03);
        lRight.rotation.set(-0.2, -0.3, -0.2);
        lRight.scale.setScalar(1.0 - t * 0.4);
        frondGroup.add(lRight);
      }

      frondGroup.rotation.y = angle;
      frondGroup.rotation.z = 0.25 + Math.random() * 0.15;
      plant.add(frondGroup);
    }

    return plant;
  }

  // Create grass blade tuft
  function createGrassTuft(): THREE.Group {
    const tuft = new THREE.Group();
    const bladeGeo = new THREE.ConeGeometry(0.025, 0.24, 4);
    bladeGeo.translate(0, 0.12, 0);

    for (let b = 0; b < 6; b++) {
      const blade = new THREE.Mesh(bladeGeo, grassMat);
      const angle = (b / 6) * Math.PI * 2;
      blade.rotation.set(0.26 + Math.random() * 0.16, angle, 0);
      tuft.add(blade);
    }
    return tuft;
  }

  // Fern spots nestled along boulder bases & berms
  const fernSpots = [
    new THREE.Vector3(-1.15, 0.22, -0.45),
    new THREE.Vector3(-1.45, 0.26, -0.05),
    new THREE.Vector3(-2.3, 0.2, -0.45),
    new THREE.Vector3(1.4, 0.22, -0.65),
    new THREE.Vector3(1.7, 0.2, 0.05),
    new THREE.Vector3(-0.85, 0.24, -1.0),
    new THREE.Vector3(0.75, 0.24, -1.0),
  ];

  fernSpots.forEach((fp) => {
    const fern = createFernPlant();
    fern.position.copy(fp);
    fern.scale.setScalar(0.75 + Math.random() * 0.35);
    foliageDetailGroup.add(fern);
  });

  // Scatter grass tufts across the mossy banks
  const grassSpots = [
    new THREE.Vector3(-1.2, 0.2, 0.4),
    new THREE.Vector3(-1.4, 0.24, 0.6),
    new THREE.Vector3(-0.95, 0.14, 0.75),
    new THREE.Vector3(-1.6, 0.26, -0.1),
    new THREE.Vector3(-2.1, 0.22, 0.3),
    new THREE.Vector3(1.2, 0.16, 0.4),
    new THREE.Vector3(1.5, 0.22, 0.5),
    new THREE.Vector3(1.1, 0.14, 0.8),
    new THREE.Vector3(1.9, 0.2, 0.1),
    new THREE.Vector3(2.3, 0.16, 0.4),
    new THREE.Vector3(-0.7, 0.18, -0.9),
    new THREE.Vector3(0.65, 0.18, -0.9),
  ];

  grassSpots.forEach((p) => {
    const tuft = createGrassTuft();
    tuft.position.copy(p);
    tuft.scale.setScalar(0.75 + Math.random() * 0.45);
    foliageDetailGroup.add(tuft);
  });

  islandGroup.add(foliageDetailGroup);

  // -------------------------------------------------------------
  // 8. Levitating Satellite Rocks & Floating Debris
  // -------------------------------------------------------------
  const satelliteRocksGroup = new THREE.Group();
  satelliteRocksGroup.name = 'satelliteRocksGroup';

  const debrisCount = 18;
  for (let i = 0; i < debrisCount; i++) {
    const sGeo = new THREE.DodecahedronGeometry(0.12 + Math.random() * 0.18, 0);
    const sMat = new THREE.MeshStandardMaterial({
      color: 0x1f2329,
      roughness: 0.96,
      metalness: 0.1,
      flatShading: true,
    });
    const sMesh = new THREE.Mesh(sGeo, sMat);

    const angle = (i / debrisCount) * Math.PI * 2 + Math.random() * 0.3;
    const dist = 0.9 + Math.random() * 2.8;
    const y = -2.2 - Math.random() * 3.6;

    sMesh.position.set(Math.cos(angle) * dist, y, Math.sin(angle) * dist);
    sMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

    sMesh.userData = {
      baseY: y,
      baseAngle: angle,
      dist: dist,
      bobSpeed: 0.7 + Math.random() * 1.1,
      bobOffset: Math.random() * Math.PI * 2,
      rotSpeed: 0.25 + Math.random() * 0.45,
    };

    satelliteRocksGroup.add(sMesh);
  }

  islandGroup.add(satelliteRocksGroup);

  return {
    islandGroup,
    terrainMesh,
    rockUndersideMesh,
    fissureMeshGroup,
    satelliteRocksGroup,
    embeddedBouldersGroup,
    pebblesGroup,
    rootsGroup,
    foliageDetailGroup,
    fissureMaterials,
  };
}
