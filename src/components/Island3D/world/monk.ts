import * as THREE from 'three';

/**
 * High-Fidelity Procedural Meditating Monk Character:
 * - Seated in padmasana (full lotus posture) on a grounding meditation zafu cushion
 * - Authentic Buddhist monastic robes (kesa / sanghati) in warm burnt saffron with sculpted fabric folds
 * - Asymmetric shawl drape sweeping over left shoulder with under-robe ochre collar trim
 * - Relaxed meditative shoulder slope and flowing bell sleeves
 * - Hands clasped in authentic Dhyana Mudra (right palm resting over left, thumbs arched touching at tips)
 * - Serene cranial anatomy with contemplative ushnisha, elongated earlobes, calm downcast eyelids, and cinnabar urna mark
 * - Gentle sinusoidal breathing animation and subtle warm golden aura
 */

export interface MonkCharacter {
  group: THREE.Group;
  breathingTorso: THREE.Group;
  headGroup: THREE.Group;
  robeMaterial: THREE.MeshStandardMaterial;
  skinMaterial: THREE.MeshStandardMaterial;
  auraMesh: THREE.Mesh;
  updateAnimation: (time: number) => void;
}

export function createMeditatingMonk(): MonkCharacter {
  const group = new THREE.Group();
  group.name = 'meditatingMonk';
  // Positioned securely in the central earthen clearing
  group.position.set(0, 0.08, 0.28);
  group.scale.set(0.92, 0.92, 0.92);

  // -------------------------------------------------------------
  // Materials: Natural Fabric, Warm Skin & Monastic Accents
  // -------------------------------------------------------------
  // Outer saffron kasaya robe (natural woven cloth with subtle velvety roughness)
  const robeMaterial = new THREE.MeshStandardMaterial({
    color: 0xa4421d,
    roughness: 0.84,
    metalness: 0.03,
    flatShading: false,
  });

  // Secondary robe fold tone (for shaded creases & lower hem)
  const robeShadowMaterial = new THREE.MeshStandardMaterial({
    color: 0x883414,
    roughness: 0.88,
    metalness: 0.02,
  });

  // Inner robe sash & collar trim (golden amber ochre)
  const sashMaterial = new THREE.MeshStandardMaterial({
    color: 0xd48729,
    roughness: 0.78,
    metalness: 0.04,
  });

  // Monk skin tone (warm natural terracotta peach)
  const skinMaterial = new THREE.MeshStandardMaterial({
    color: 0xedc7ac,
    roughness: 0.52,
    metalness: 0.02,
  });

  // Fine facial contours (closed eyelashes & calm lip line)
  const facialDetailsMaterial = new THREE.MeshBasicMaterial({
    color: 0x2e1910,
  });

  // Sacred urna forehead wisdom mark (cinnabar red)
  const urnaMaterial = new THREE.MeshBasicMaterial({
    color: 0xa82012,
  });

  // Meditation cushion (zafu) - rich dark earthy woven canvas
  const cushionMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d2a1d,
    roughness: 0.92,
    metalness: 0.03,
  });

  // Cushion piping / welt seam
  const weltMaterial = new THREE.MeshStandardMaterial({
    color: 0x5a4030,
    roughness: 0.85,
    metalness: 0.04,
  });

  // -------------------------------------------------------------
  // 0. Meditation Cushion (Zafu) with Detailed Welt Trim
  // -------------------------------------------------------------
  const cushionGroup = new THREE.Group();
  cushionGroup.position.set(0, 0.07, 0);

  const cushionGeo = new THREE.CylinderGeometry(0.88, 0.96, 0.15, 32);
  cushionGeo.scale(1.18, 1.0, 0.94);
  const cushionMesh = new THREE.Mesh(cushionGeo, cushionMaterial);
  cushionMesh.receiveShadow = true;
  cushionGroup.add(cushionMesh);

  // Outer welt rim around cushion
  const weltGeo = new THREE.TorusGeometry(0.92, 0.024, 8, 32);
  weltGeo.scale(1.18, 0.94, 1.0);
  weltGeo.rotateX(Math.PI / 2);
  const weltMesh = new THREE.Mesh(weltGeo, weltMaterial);
  cushionGroup.add(weltMesh);

  group.add(cushionGroup);

  // -------------------------------------------------------------
  // 1. Folded Lotus Legs & Lower Robe (Padmasana)
  // -------------------------------------------------------------
  const lowerBodyGroup = new THREE.Group();
  lowerBodyGroup.position.set(0, 0.14, 0);

  // Main draped seat mound
  const seatGeo = new THREE.CylinderGeometry(0.82, 0.94, 0.3, 28);
  seatGeo.scale(1.22, 1.0, 0.9);
  const seatMesh = new THREE.Mesh(seatGeo, robeMaterial);
  seatMesh.position.set(0, 0.15, 0);
  seatMesh.castShadow = true;
  seatMesh.receiveShadow = true;
  lowerBodyGroup.add(seatMesh);

  // Left crossed knee & thigh with draped fabric
  const leftKneeGeo = new THREE.SphereGeometry(0.33, 18, 18);
  leftKneeGeo.scale(1.38, 0.76, 0.98);
  const leftKnee = new THREE.Mesh(leftKneeGeo, robeMaterial);
  leftKnee.position.set(-0.62, 0.19, 0.15);
  leftKnee.rotation.set(0.12, 0.28, -0.18);
  leftKnee.castShadow = true;
  lowerBodyGroup.add(leftKnee);

  // Right crossed knee & thigh
  const rightKneeGeo = new THREE.SphereGeometry(0.33, 18, 18);
  rightKneeGeo.scale(1.38, 0.76, 0.98);
  const rightKnee = new THREE.Mesh(rightKneeGeo, robeMaterial);
  rightKnee.position.set(0.62, 0.19, 0.15);
  rightKnee.rotation.set(0.12, -0.28, 0.18);
  rightKnee.castShadow = true;
  lowerBodyGroup.add(rightKnee);

  // Sculpted cloth fold swaths across lap
  const lapFoldGeo1 = new THREE.TorusGeometry(0.55, 0.045, 10, 24, Math.PI * 0.75);
  const lapFold1 = new THREE.Mesh(lapFoldGeo1, robeShadowMaterial);
  lapFold1.rotation.set(Math.PI / 2.3, 0.1, -0.2);
  lapFold1.position.set(-0.08, 0.26, 0.24);
  lowerBodyGroup.add(lapFold1);

  const lapFoldGeo2 = new THREE.TorusGeometry(0.48, 0.038, 10, 24, Math.PI * 0.7);
  const lapFold2 = new THREE.Mesh(lapFoldGeo2, robeMaterial);
  lapFold2.rotation.set(Math.PI / 2.2, -0.1, 0.25);
  lapFold2.position.set(0.08, 0.22, 0.32);
  lowerBodyGroup.add(lapFold2);

  // Bare upturned feet resting flat on thighs in full padmasana
  const footGeo = new THREE.CapsuleGeometry(0.085, 0.21, 10, 14);

  // Left foot resting on right thigh
  const leftFoot = new THREE.Mesh(footGeo, skinMaterial);
  leftFoot.rotation.set(Math.PI / 2.05, 0.22, Math.PI / 4.4);
  leftFoot.position.set(-0.25, 0.24, 0.31);
  leftFoot.castShadow = true;
  lowerBodyGroup.add(leftFoot);

  // Right foot resting on left thigh
  const rightFoot = new THREE.Mesh(footGeo, skinMaterial);
  rightFoot.rotation.set(Math.PI / 2.05, -0.22, -Math.PI / 4.4);
  rightFoot.position.set(0.25, 0.24, 0.31);
  rightFoot.castShadow = true;
  lowerBodyGroup.add(rightFoot);

  // Toe details for organic touch
  [-0.23, 0.23].forEach((fx) => {
    const toesGeo = new THREE.SphereGeometry(0.045, 8, 8);
    toesGeo.scale(1.2, 0.7, 0.9);
    const toes = new THREE.Mesh(toesGeo, skinMaterial);
    toes.position.set(fx, 0.24, 0.42);
    lowerBodyGroup.add(toes);
  });

  group.add(lowerBodyGroup);

  // -------------------------------------------------------------
  // 2. Torso with Sculpted Robe Folds (Breathing Rhythm)
  // -------------------------------------------------------------
  const breathingTorso = new THREE.Group();
  breathingTorso.position.set(0, 0.38, 0);

  // Core torso volume
  const torsoGeo = new THREE.CylinderGeometry(0.39, 0.49, 0.7, 28);
  torsoGeo.scale(1.1, 1.0, 0.88);
  const torsoMesh = new THREE.Mesh(torsoGeo, robeMaterial);
  torsoMesh.position.set(0, 0.35, 0);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  breathingTorso.add(torsoMesh);

  // Asymmetric monastic shawl (kesa) sweeping diagonally over left shoulder
  const shawlCurvePoints = [
    new THREE.Vector3(0.42, 0.16, 0.22),   // right waist
    new THREE.Vector3(0.18, 0.38, 0.32),   // mid sternum
    new THREE.Vector3(-0.16, 0.58, 0.26),  // left collarbone
    new THREE.Vector3(-0.38, 0.68, 0.08),  // over left shoulder
    new THREE.Vector3(-0.35, 0.45, -0.24), // down left back
    new THREE.Vector3(0.08, 0.22, -0.26),  // across back to right waist
  ];
  const shawlCurve = new THREE.CatmullRomCurve3(shawlCurvePoints, true);
  const shawlGeo = new THREE.TubeGeometry(shawlCurve, 36, 0.052, 10, true);
  const shawlMesh = new THREE.Mesh(shawlGeo, sashMaterial);
  shawlMesh.castShadow = true;
  breathingTorso.add(shawlMesh);

  // Secondary draped cloth sweeps across chest
  const drapeFold1 = new THREE.TorusGeometry(0.38, 0.038, 10, 24, Math.PI * 0.9);
  const drapeMesh1 = new THREE.Mesh(drapeFold1, robeMaterial);
  drapeMesh1.position.set(0.01, 0.34, 0.16);
  drapeMesh1.rotation.set(0.35, -0.16, 0.78);
  breathingTorso.add(drapeMesh1);

  const drapeFold2 = new THREE.TorusGeometry(0.4, 0.032, 10, 24, Math.PI * 0.8);
  const drapeMesh2 = new THREE.Mesh(drapeFold2, robeShadowMaterial);
  drapeMesh2.position.set(-0.02, 0.22, 0.17);
  drapeMesh2.rotation.set(0.24, -0.1, 0.72);
  breathingTorso.add(drapeMesh2);

  // -------------------------------------------------------------
  // 3. Relaxed Shoulders, Flowing Sleeves & Dhyana Mudra
  // -------------------------------------------------------------
  // Shoulders with natural relaxed slope
  const shoulderGeo = new THREE.SphereGeometry(0.24, 16, 16);
  shoulderGeo.scale(1.2, 0.8, 1.0);

  const leftShoulder = new THREE.Mesh(shoulderGeo, robeMaterial);
  leftShoulder.position.set(-0.46, 0.62, 0.02);
  breathingTorso.add(leftShoulder);

  const rightShoulder = new THREE.Mesh(shoulderGeo, robeMaterial);
  rightShoulder.position.set(0.46, 0.62, 0.02);
  breathingTorso.add(rightShoulder);

  // Loose bell sleeves
  const sleeveGeo = new THREE.CylinderGeometry(0.18, 0.25, 0.54, 20);

  // Left sleeve
  const leftSleeve = new THREE.Mesh(sleeveGeo, robeMaterial);
  leftSleeve.position.set(-0.49, 0.44, 0.1);
  leftSleeve.rotation.set(0.36, 0.1, -0.5);
  leftSleeve.castShadow = true;
  breathingTorso.add(leftSleeve);

  // Right sleeve
  const rightSleeve = new THREE.Mesh(sleeveGeo, robeMaterial);
  rightSleeve.position.set(0.49, 0.44, 0.1);
  rightSleeve.rotation.set(0.36, -0.1, 0.5);
  rightSleeve.castShadow = true;
  breathingTorso.add(rightSleeve);

  // Forearms angled into the lap
  const forearmGeo = new THREE.CapsuleGeometry(0.082, 0.36, 10, 14);

  const leftForearm = new THREE.Mesh(forearmGeo, skinMaterial);
  leftForearm.position.set(-0.23, 0.22, 0.35);
  leftForearm.rotation.set(Math.PI / 2.3, 0.38, -0.84);
  breathingTorso.add(leftForearm);

  const rightForearm = new THREE.Mesh(forearmGeo, skinMaterial);
  rightForearm.position.set(0.23, 0.22, 0.35);
  rightForearm.rotation.set(Math.PI / 2.3, -0.38, 0.84);
  breathingTorso.add(rightForearm);

  // -------------------------------------------------------------
  // Classical Dhyana Mudra (Cosmic Meditation Gesture):
  // - Left palm rests flat and open in lap
  // - Right palm rests flat and open directly inside left palm
  // - Both thumbs gently curve up and touch at tips forming an oval void
  // -------------------------------------------------------------
  const mudraGroup = new THREE.Group();
  mudraGroup.name = 'dhyanaMudra';
  mudraGroup.position.set(0, 0.21, 0.38);

  const palmGeo = new THREE.BoxGeometry(0.18, 0.038, 0.13);

  // Left hand (base palm)
  const leftHand = new THREE.Mesh(palmGeo, skinMaterial);
  leftHand.position.set(0, 0, 0);
  mudraGroup.add(leftHand);

  // Right hand (resting on top)
  const rightHand = new THREE.Mesh(palmGeo, skinMaterial);
  rightHand.position.set(0, 0.036, 0.012);
  mudraGroup.add(rightHand);

  // Sculpted fingers resting in serene unison
  const fingersGeo = new THREE.CapsuleGeometry(0.016, 0.12, 6, 8);
  fingersGeo.rotateZ(Math.PI / 2);

  const leftFingers = new THREE.Mesh(fingersGeo, skinMaterial);
  leftFingers.position.set(0.09, 0.005, 0.04);
  mudraGroup.add(leftFingers);

  const rightFingers = new THREE.Mesh(fingersGeo, skinMaterial);
  rightFingers.position.set(0.09, 0.04, 0.05);
  mudraGroup.add(rightFingers);

  // Curved thumbs meeting at the tips
  const thumbGeo = new THREE.CapsuleGeometry(0.024, 0.08, 6, 8);

  const leftThumb = new THREE.Mesh(thumbGeo, skinMaterial);
  leftThumb.position.set(-0.065, 0.075, 0.018);
  leftThumb.rotation.set(0.28, 0.05, 0.75);
  mudraGroup.add(leftThumb);

  const rightThumb = new THREE.Mesh(thumbGeo, skinMaterial);
  rightThumb.position.set(0.065, 0.075, 0.018);
  rightThumb.rotation.set(0.28, -0.05, -0.75);
  mudraGroup.add(rightThumb);

  breathingTorso.add(mudraGroup);

  // -------------------------------------------------------------
  // 4. Harmonious Head, Ushnisha & Contemplative Facial Features
  // -------------------------------------------------------------
  const headGroup = new THREE.Group();
  headGroup.name = 'monkHead';
  headGroup.position.set(0, 0.72, 0);

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.145, 0.185, 0.17, 20);
  const neckMesh = new THREE.Mesh(neckGeo, skinMaterial);
  neckMesh.position.set(0, 0.045, 0);
  headGroup.add(neckMesh);

  // Golden under-robe collar ring
  const collarGeo = new THREE.TorusGeometry(0.175, 0.03, 8, 24);
  collarGeo.rotateX(Math.PI / 2);
  const collarMesh = new THREE.Mesh(collarGeo, sashMaterial);
  collarMesh.position.set(0, 0.015, 0);
  headGroup.add(collarMesh);

  // Cranial dome with soft chin and jaw contours
  const headGeo = new THREE.SphereGeometry(0.32, 32, 32);
  headGeo.scale(1.0, 1.1, 1.02);
  const headMesh = new THREE.Mesh(headGeo, skinMaterial);
  headMesh.position.set(0, 0.33, 0);
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  // Ushnisha (sacred meditative cranial bump at top of head)
  const ushnishaGeo = new THREE.SphereGeometry(0.12, 16, 16);
  ushnishaGeo.scale(1.0, 0.65, 0.95);
  const ushnishaMesh = new THREE.Mesh(ushnishaGeo, skinMaterial);
  ushnishaMesh.position.set(0, 0.66, -0.02);
  headGroup.add(ushnishaMesh);

  // Elongated monastic ears (traditional wisdom lobes)
  const earGeo = new THREE.CapsuleGeometry(0.042, 0.16, 8, 12);

  const leftEar = new THREE.Mesh(earGeo, skinMaterial);
  leftEar.position.set(-0.33, 0.31, -0.02);
  leftEar.rotation.set(0.1, 0, -0.15);
  headGroup.add(leftEar);

  const rightEar = new THREE.Mesh(earGeo, skinMaterial);
  rightEar.position.set(0.33, 0.31, -0.02);
  rightEar.rotation.set(0.1, 0, 0.15);
  headGroup.add(rightEar);

  // Gentle straight nose bridge
  const noseGeo = new THREE.ConeGeometry(0.036, 0.095, 8);
  const noseMesh = new THREE.Mesh(noseGeo, skinMaterial);
  noseMesh.position.set(0, 0.285, 0.33);
  noseMesh.rotation.x = 0.24;
  headGroup.add(noseMesh);

  // Contemplative downcast closed eyelids (peaceful curved arcs)
  const eyeCurveGeo = new THREE.TorusGeometry(0.044, 0.009, 6, 14, Math.PI * 0.85);

  const leftEye = new THREE.Mesh(eyeCurveGeo, facialDetailsMaterial);
  leftEye.position.set(-0.105, 0.295, 0.315);
  leftEye.rotation.set(Math.PI + 0.16, 0, 0.08);
  headGroup.add(leftEye);

  const rightEye = new THREE.Mesh(eyeCurveGeo, facialDetailsMaterial);
  rightEye.position.set(0.105, 0.295, 0.315);
  rightEye.rotation.set(Math.PI + 0.16, 0, -0.08);
  headGroup.add(rightEye);

  // Subtle curved brows
  const browGeo = new THREE.TorusGeometry(0.046, 0.007, 6, 12, Math.PI * 0.7);

  const leftBrow = new THREE.Mesh(browGeo, facialDetailsMaterial);
  leftBrow.position.set(-0.105, 0.355, 0.315);
  leftBrow.rotation.set(0.12, 0, 0.1);
  headGroup.add(leftBrow);

  const rightBrow = new THREE.Mesh(browGeo, facialDetailsMaterial);
  rightBrow.position.set(0.105, 0.355, 0.315);
  rightBrow.rotation.set(0.12, 0, -0.1);
  headGroup.add(rightBrow);

  // Calm, serene smiling mouth
  const mouthGeo = new THREE.TorusGeometry(0.038, 0.007, 6, 12, Math.PI * 0.6);
  const mouthMesh = new THREE.Mesh(mouthGeo, facialDetailsMaterial);
  mouthMesh.position.set(0, 0.19, 0.32);
  mouthMesh.rotation.set(0.22, 0, 0);
  headGroup.add(mouthMesh);

  // Sacred red urna dot between the brows
  const urnaGeo = new THREE.SphereGeometry(0.019, 10, 10);
  urnaGeo.scale(1, 1, 0.4);
  const urnaMesh = new THREE.Mesh(urnaGeo, urnaMaterial);
  urnaMesh.position.set(0, 0.38, 0.325);
  headGroup.add(urnaMesh);

  breathingTorso.add(headGroup);
  group.add(breathingTorso);

  // -------------------------------------------------------------
  // 5. Warm Golden Translucent Aura
  // -------------------------------------------------------------
  const auraGeo = new THREE.SphereGeometry(1.2, 28, 28);
  const auraMat = new THREE.MeshBasicMaterial({
    color: 0xffd97d,
    transparent: true,
    opacity: 0.08,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    depthWrite: false,
  });
  const auraMesh = new THREE.Mesh(auraGeo, auraMat);
  auraMesh.position.set(0, 0.78, 0.08);
  group.add(auraMesh);

  // -------------------------------------------------------------
  // 6. Animation update: 4-Second Meditative Breathing Cycle
  // -------------------------------------------------------------
  const updateAnimation = (time: number) => {
    // 4-second breathing rhythm (0.25 Hz = 1.57 rad/sec)
    const breath = Math.sin(time * 1.57);
    const breathScale = 1.0 + breath * 0.024;
    breathingTorso.scale.set(breathScale, 1.0 + breath * 0.034, breathScale);
    breathingTorso.position.y = 0.38 + breath * 0.014;

    // Gentle micro-tilt of head
    headGroup.rotation.x = Math.sin(time * 0.78) * 0.015;

    // Soft aura expansion with breathing
    auraMesh.scale.setScalar(1.0 + breath * 0.06);
    auraMat.opacity = 0.06 + breath * 0.025;
  };

  return {
    group,
    breathingTorso,
    headGroup,
    robeMaterial,
    skinMaterial,
    auraMesh,
    updateAnimation,
  };
}
