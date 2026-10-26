import * as THREE from 'three';

/**
 * Vegetation system for HabitFlow:
 * - Ancient twisted bonsai trees with gnarled bark & layered cloud foliage
 * - Nodding violet lotus/bell wildflowers on slender stems
 * - Miniature sacred mushrooms and saplings
 * - Responsive to growth stages (1 through 5)
 */

export interface VegetationSystem {
  group: THREE.Group;
  bonsaiTreesGroup: THREE.Group;
  flowersGroup: THREE.Group;
  mushroomsGroup: THREE.Group;
  updateStage: (stage: number, progressRatio: number) => void;
  updateAnimation: (time: number) => void;
}

export function buildVegetationSystem(): VegetationSystem {
  const group = new THREE.Group();
  group.name = 'vegetationSystem';

  const bonsaiTreesGroup = new THREE.Group();
  const flowersGroup = new THREE.Group();
  const mushroomsGroup = new THREE.Group();

  group.add(bonsaiTreesGroup);
  group.add(flowersGroup);
  group.add(mushroomsGroup);

  // -------------------------------------------------------------
  // Materials
  // -------------------------------------------------------------
  // Weathered dark bonsai bark
  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x3a281c,
    roughness: 0.92,
    metalness: 0.05,
    flatShading: true,
  });

  // Layered deep emerald pine cloud foliage
  const foliageMat1 = new THREE.MeshStandardMaterial({
    color: 0x173819,
    roughness: 0.88,
    metalness: 0.02,
    flatShading: true,
  });

  const foliageMat2 = new THREE.MeshStandardMaterial({
    color: 0x224d25,
    roughness: 0.85,
    metalness: 0.02,
    flatShading: true,
  });

  // Lavender/violet wildflower petals
  const flowerPetalMat = new THREE.MeshStandardMaterial({
    color: 0xd6b3ff,
    emissive: 0x5a2d99,
    emissiveIntensity: 0.25,
    roughness: 0.5,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x36632c,
    roughness: 0.8,
  });

  // Mushroom cap & stem
  const mushroomCapMat = new THREE.MeshStandardMaterial({
    color: 0xba9ee0,
    emissive: 0x3f2469,
    emissiveIntensity: 0.2,
    roughness: 0.45,
  });

  const mushroomStemMat = new THREE.MeshStandardMaterial({
    color: 0xf5f0eb,
    roughness: 0.7,
  });

  // -------------------------------------------------------------
  // 1. Ancient Twisted Bonsai Tree (Left Hero Bonsai)
  // -------------------------------------------------------------
  function buildMainBonsaiTree(): THREE.Group {
    const treeGroup = new THREE.Group();
    treeGroup.name = 'heroBonsai';
    treeGroup.position.set(-1.85, 0.52, -0.5);

    // Twisted gnarled trunk using multi-segment curved tube
    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.15, 0.5, 0.1),
      new THREE.Vector3(0.45, 1.1, 0.2),
      new THREE.Vector3(0.35, 1.6, 0.15),
      new THREE.Vector3(0.65, 2.1, 0.1),
    ]);
    const trunkGeo = new THREE.TubeGeometry(trunkCurve, 20, 0.14, 8, false);
    const trunkMesh = new THREE.Mesh(trunkGeo, barkMat);
    trunkMesh.castShadow = true;
    trunkMesh.receiveShadow = true;
    treeGroup.add(trunkMesh);

    // Primary lower left branch
    const branchCurve1 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.45, 1.1, 0.2),
      new THREE.Vector3(0.1, 1.3, 0.45),
      new THREE.Vector3(-0.35, 1.45, 0.6),
    ]);
    const branchGeo1 = new THREE.TubeGeometry(branchCurve1, 12, 0.08, 6, false);
    const branchMesh1 = new THREE.Mesh(branchGeo1, barkMat);
    branchMesh1.castShadow = true;
    treeGroup.add(branchMesh1);

    // Secondary upper branch
    const branchCurve2 = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.5, 1.7, 0.15),
      new THREE.Vector3(0.9, 1.95, 0.05),
      new THREE.Vector3(1.2, 2.1, -0.1),
    ]);
    const branchGeo2 = new THREE.TubeGeometry(branchCurve2, 12, 0.07, 6, false);
    const branchMesh2 = new THREE.Mesh(branchGeo2, barkMat);
    branchMesh2.castShadow = true;
    treeGroup.add(branchMesh2);

    // Layered cloud foliage pads (characteristic Japanese niwaki / bonsai clouds)
    const cloudConfigs = [
      // Top apex cloud (large)
      { pos: new THREE.Vector3(0.7, 2.25, 0.1), scale: new THREE.Vector3(1.1, 0.45, 0.9), mat: foliageMat2 },
      // Upper right cloud
      { pos: new THREE.Vector3(1.3, 2.15, -0.1), scale: new THREE.Vector3(0.85, 0.38, 0.75), mat: foliageMat1 },
      // Lower left cloud
      { pos: new THREE.Vector3(-0.45, 1.55, 0.65), scale: new THREE.Vector3(0.95, 0.4, 0.8), mat: foliageMat2 },
      // Mid cluster cloud
      { pos: new THREE.Vector3(0.3, 1.8, -0.2), scale: new THREE.Vector3(0.75, 0.35, 0.7), mat: foliageMat1 },
      // Lower secondary tier cloud
      { pos: new THREE.Vector3(-0.6, 1.25, 0.4), scale: new THREE.Vector3(0.65, 0.32, 0.55), mat: foliageMat1 },
    ];

    cloudConfigs.forEach((c, idx) => {
      const geo = new THREE.DodecahedronGeometry(0.55, 1);
      const mesh = new THREE.Mesh(geo, c.mat);
      mesh.name = `foliageCloud_${idx}`;
      mesh.position.copy(c.pos);
      mesh.scale.copy(c.scale);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      treeGroup.add(mesh);
    });

    return treeGroup;
  }

  // -------------------------------------------------------------
  // 2. Right Graceful Sapling / Young Bonsai
  // -------------------------------------------------------------
  function buildRightBonsaiTree(): THREE.Group {
    const treeGroup = new THREE.Group();
    treeGroup.name = 'rightBonsai';
    treeGroup.position.set(1.85, 0.42, -0.4);

    const trunkCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.1, 0.45, 0.05),
      new THREE.Vector3(0.05, 0.95, -0.1),
      new THREE.Vector3(-0.15, 1.45, 0.1),
    ]);
    const trunkGeo = new THREE.TubeGeometry(trunkCurve, 16, 0.09, 7, false);
    const trunkMesh = new THREE.Mesh(trunkGeo, barkMat);
    trunkMesh.castShadow = true;
    treeGroup.add(trunkMesh);

    // Foliage pads
    const clouds = [
      { pos: new THREE.Vector3(-0.2, 1.55, 0.1), scale: new THREE.Vector3(0.75, 0.35, 0.65) },
      { pos: new THREE.Vector3(0.25, 1.25, -0.15), scale: new THREE.Vector3(0.6, 0.3, 0.55) },
      { pos: new THREE.Vector3(-0.35, 0.95, 0.2), scale: new THREE.Vector3(0.5, 0.25, 0.45) },
    ];

    clouds.forEach((c) => {
      const geo = new THREE.DodecahedronGeometry(0.45, 1);
      const mesh = new THREE.Mesh(geo, foliageMat2);
      mesh.position.copy(c.pos);
      mesh.scale.copy(c.scale);
      mesh.castShadow = true;
      treeGroup.add(mesh);
    });

    return treeGroup;
  }

  // -------------------------------------------------------------
  // 3. Foreground Sprout / Young Sapling (Right front)
  // -------------------------------------------------------------
  function buildForegroundSprout(): THREE.Group {
    const sproutGroup = new THREE.Group();
    sproutGroup.name = 'foregroundSprout';
    sproutGroup.position.set(1.5, 0.2, 0.8);

    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.04, 0.3, 0.02),
      new THREE.Vector3(-0.02, 0.65, 0.06),
    ]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 10, 0.035, 6, false);
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    sproutGroup.add(stemMesh);

    // Fresh young leaves
    const leafGeo = new THREE.SphereGeometry(0.12, 8, 8);
    leafGeo.scale(1.4, 0.15, 0.8);

    for (let i = 0; i < 4; i++) {
      const leaf = new THREE.Mesh(leafGeo, foliageMat2);
      leaf.position.set(0, 0.45 + i * 0.07, 0);
      leaf.rotation.set(0.3, (i * Math.PI) / 2, 0.3);
      sproutGroup.add(leaf);
    }

    return sproutGroup;
  }

  const heroBonsai = buildMainBonsaiTree();
  const rightBonsai = buildRightBonsaiTree();
  const sprout = buildForegroundSprout();

  bonsaiTreesGroup.add(heroBonsai);
  bonsaiTreesGroup.add(rightBonsai);
  bonsaiTreesGroup.add(sprout);

  // -------------------------------------------------------------
  // 4. Wildflowers (Lotus / Bell blossoms matching image)
  // -------------------------------------------------------------
  const flowerPositions = [
    // Near left bonsai base:
    new THREE.Vector3(-1.3, 0.22, 0.2),
    new THREE.Vector3(-1.5, 0.25, 0.5),
    new THREE.Vector3(-1.1, 0.18, 0.6),
    new THREE.Vector3(-1.7, 0.28, -0.2),
    // Near monk's left:
    new THREE.Vector3(-0.8, 0.14, 0.8),
    new THREE.Vector3(-0.95, 0.12, 1.2),
    // Near monk's right:
    new THREE.Vector3(0.9, 0.15, 0.7),
    new THREE.Vector3(1.1, 0.12, 1.1),
    // Right side clusters:
    new THREE.Vector3(1.3, 0.18, 0.3),
    new THREE.Vector3(1.8, 0.22, 0.2),
    new THREE.Vector3(2.3, 0.18, 0.6),
  ];

  flowerPositions.forEach((pos, idx) => {
    const fGroup = new THREE.Group();
    fGroup.position.copy(pos);

    // Slender curving stem
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.02, 0.15, (Math.random() - 0.5) * 0.05),
      new THREE.Vector3(0.04, 0.32, 0.04),
    ]);
    const stem = new THREE.Mesh(new THREE.TubeGeometry(stemCurve, 8, 0.018, 5, false), stemMat);
    fGroup.add(stem);

    // Bell/lotus flower blossom head (5 petals around center)
    const blossomGroup = new THREE.Group();
    blossomGroup.position.set(0.04, 0.32, 0.04);
    blossomGroup.rotation.x = 0.25;

    const petalGeo = new THREE.ConeGeometry(0.065, 0.15, 6, 1, true);
    petalGeo.rotateX(Math.PI);

    for (let p = 0; p < 5; p++) {
      const petal = new THREE.Mesh(petalGeo, flowerPetalMat);
      const angle = (p / 5) * Math.PI * 2;
      petal.rotation.set(0.4, angle, 0);
      petal.scale.set(0.9, 1.1, 0.9);
      blossomGroup.add(petal);
    }

    // Glowing pistil/core
    const coreMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.03, 8, 8),
      new THREE.MeshBasicMaterial({ color: 0xffe88a })
    );
    blossomGroup.add(coreMesh);

    fGroup.add(blossomGroup);

    // Save for sway animation
    fGroup.userData = {
      baseRotX: 0,
      phase: idx * 0.7 + Math.random(),
    };

    flowersGroup.add(fGroup);
  });

  // -------------------------------------------------------------
  // 5. Miniature Sacred Mushrooms
  // -------------------------------------------------------------
  const mushroomPositions = [
    new THREE.Vector3(-1.8, 0.28, -0.4),
    new THREE.Vector3(-2.0, 0.3, -0.2),
    new THREE.Vector3(-1.6, 0.22, 0.8),
    new THREE.Vector3(1.7, 0.25, -0.2),
    new THREE.Vector3(2.1, 0.2, 0.4),
  ];

  mushroomPositions.forEach((pos) => {
    const mGroup = new THREE.Group();
    mGroup.position.copy(pos);

    const mStem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.035, 0.14, 8),
      mushroomStemMat
    );
    mStem.position.set(0, 0.07, 0);
    mGroup.add(mStem);

    const mCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 10, 10, 0, Math.PI * 2, 0, Math.PI * 0.55),
      mushroomCapMat
    );
    mCap.position.set(0, 0.14, 0);
    mGroup.add(mCap);

    mushroomsGroup.add(mGroup);
  });

  // -------------------------------------------------------------
  // Stage management & growth animation
  // -------------------------------------------------------------
  const updateStage = (stage: number, progressRatio: number) => {
    // Stage scales:
    // Stage 1: small saplings, sparse flowers
    // Stage 5: lush mature canopy, blooming blossoms
    const stageScales = [0.38, 0.58, 0.78, 0.92, 1.05];
    const targetScale = stageScales[stage - 1] || 1.0;

    heroBonsai.scale.setScalar(targetScale);
    rightBonsai.scale.setScalar(targetScale * 0.9);
    sprout.scale.setScalar(Math.min(1.2, 0.6 + progressRatio * 0.6));

    // Visibility of flowers and mushrooms according to stage
    flowersGroup.children.forEach((flower, i) => {
      // Stage 1: only 2 flowers
      // Stage 2: 4 flowers
      // Stage 3: 7 flowers
      // Stage 4: 9 flowers
      // Stage 5: all 11 flowers
      const flowerThresholds = [2, 4, 7, 9, 11];
      const maxVisible = flowerThresholds[stage - 1] || 11;
      flower.visible = i < maxVisible;
      flower.scale.setScalar(0.7 + stage * 0.08);
    });

    mushroomsGroup.children.forEach((shroom, i) => {
      shroom.visible = stage >= 2 && i < stage * 2;
    });
  };

  const updateAnimation = (time: number) => {
    // Subtle organic wind sway in flowers & bonsai clouds
    flowersGroup.children.forEach((f) => {
      if (!f.visible) return;
      const phase = f.userData.phase || 0;
      f.rotation.z = Math.sin(time * 2.2 + phase) * 0.08;
      f.rotation.x = Math.cos(time * 1.8 + phase) * 0.06;
    });
  };

  return {
    group,
    bonsaiTreesGroup,
    flowersGroup,
    mushroomsGroup,
    updateStage,
    updateAnimation,
  };
}
