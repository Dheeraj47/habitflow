import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildFloatingIsland, IslandComponents } from './islandGeometry';
import { createMeditatingMonk, MonkCharacter } from './monk';
import { buildCrystalCluster, CrystalCluster } from './crystal';
import { buildVegetationSystem, VegetationSystem } from './vegetation';
import { buildParticleSystem, ParticleSystem } from './particles';
import { SanctuaryStage, SANCTUARY_STAGES } from '../utils/habitRules';

export type CameraPreset = 'overview' | 'monk' | 'fissures' | 'canopy';

interface CameraTargetDef {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

const CAMERA_PRESETS: Record<CameraPreset, CameraTargetDef> = {
  // Majestic balanced three-quarter view displaying monk, crystal, terrain, and entire tapered rocky underside
  overview: {
    position: new THREE.Vector3(0.0, 4.4, 15.6),
    target: new THREE.Vector3(0.0, -0.6, 0.0),
  },
  // Intimate front-angle view focused on the serene meditating monk
  monk: {
    position: new THREE.Vector3(0.0, 1.8, 5.2),
    target: new THREE.Vector3(0.0, 0.85, 0.28),
  },
  // Dramatic low angle revealing the glowing cyan fissures and rocky underbody
  fissures: {
    position: new THREE.Vector3(2.4, -3.2, 8.0),
    target: new THREE.Vector3(0.2, -1.8, 0.1),
  },
  // Top-down / side canopy angle highlighting the ancient bonsai trees and lush moss
  canopy: {
    position: new THREE.Vector3(-4.6, 4.4, 4.2),
    target: new THREE.Vector3(-1.3, 0.75, -0.2),
  },
};

export class SanctuarySceneManager {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private isSoftwareGl: boolean = false;
  private clock: THREE.Clock;
  private frameId: number = 0;
  private isDestroyed: boolean = false;

  // Scene sub-systems
  private island: IslandComponents;
  private monk: MonkCharacter;
  private crystal: CrystalCluster;
  private vegetation: VegetationSystem;
  private particles: ParticleSystem;

  // Dynamic lights
  private moonKeyLight: THREE.DirectionalLight;
  private warmMonkLight: THREE.PointLight;
  private cyanFissureLight1: THREE.PointLight;
  private cyanFissureLight2: THREE.PointLight;
  private cyanFissureLight3: THREE.PointLight;

  // State
  private currentStage: SanctuaryStage = 3;
  private currentProgress: number = 60; // 0-100%
  private activePreset: CameraPreset = 'overview';
  private isTransitioningCamera: boolean = false;
  private targetCamPos = new THREE.Vector3();
  private targetCamLook = new THREE.Vector3();

  // Reusable vectors for zero-GC loop
  private _vec3A = new THREE.Vector3();

  constructor(container: HTMLElement) {
    this.container = container;

    // 1. Detect software WebGL from GPU renderer string
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 2. Initialize WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // 3. Initialize Scene, Camera & Background
    this.scene = new THREE.Scene();
    // Deep midnight-blue atmospheric background
    const bgMidnight = new THREE.Color(0x0a0e18);
    this.scene.background = bgMidnight;
    this.scene.fog = new THREE.FogExp2(0x0a0e18, 0.024);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(42, aspect, 0.1, 80);

    const initial = CAMERA_PRESETS.overview;
    this.camera.position.copy(initial.position);
    this.targetCamPos.copy(initial.position);
    this.targetCamLook.copy(initial.target);

    // 4. OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 2.4;
    this.controls.maxDistance = 22.0;
    this.controls.maxPolarAngle = Math.PI * 0.88; // prevent under-floor inversion
    this.controls.target.copy(initial.target);
    this.controls.update();

    // Cancel camera transition if user manually interacts
    this.controls.addEventListener('start', () => {
      this.isTransitioningCamera = false;
    });

    // 5. Studio Environment Map (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 6. Lighting Rig
    // Hemisphere fill (cool midnight sky, dark slate ground)
    const hemiLight = new THREE.HemisphereLight(0x283654, 0x0c111a, 0.85);
    this.scene.add(hemiLight);

    // Directional Key Light (Moonlight from above left)
    this.moonKeyLight = new THREE.DirectionalLight(0xcfdcff, 1.6);
    this.moonKeyLight.position.set(-5.0, 9.0, 4.0);
    this.moonKeyLight.castShadow = !this.isSoftwareGl;
    this.moonKeyLight.shadow.mapSize.width = 1024;
    this.moonKeyLight.shadow.mapSize.height = 1024;
    this.moonKeyLight.shadow.camera.near = 0.5;
    this.moonKeyLight.shadow.camera.far = 24;
    const d = 6.0;
    this.moonKeyLight.shadow.camera.left = -d;
    this.moonKeyLight.shadow.camera.right = d;
    this.moonKeyLight.shadow.camera.top = d;
    this.moonKeyLight.shadow.camera.bottom = -d;
    this.moonKeyLight.shadow.bias = -0.0005;
    this.moonKeyLight.shadow.normalBias = 0.02;
    this.scene.add(this.moonKeyLight);

    // Warm fill light on the monk
    this.warmMonkLight = new THREE.PointLight(0xffb76b, 1.4, 6, 1.8);
    this.warmMonkLight.position.set(0, 0.8, 1.8);
    this.scene.add(this.warmMonkLight);

    // Cyan bounce lights under the island for the fissures
    this.cyanFissureLight1 = new THREE.PointLight(0x00ffff, 2.5, 8, 1.4);
    this.cyanFissureLight1.position.set(0.6, -2.0, 2.2);
    this.scene.add(this.cyanFissureLight1);

    this.cyanFissureLight2 = new THREE.PointLight(0x00e1ff, 2.0, 7, 1.4);
    this.cyanFissureLight2.position.set(-1.4, -2.8, 1.2);
    this.scene.add(this.cyanFissureLight2);

    this.cyanFissureLight3 = new THREE.PointLight(0x00d4ff, 2.2, 7, 1.4);
    this.cyanFissureLight3.position.set(1.6, -2.6, 0.8);
    this.scene.add(this.cyanFissureLight3);

    // Subtle cool rim light illuminating the lower tapered rock silhouette
    const undersideRim = new THREE.DirectionalLight(0x406095, 0.9);
    undersideRim.position.set(1.5, -6.0, -2.5);
    this.scene.add(undersideRim);

    // 7. Build World Elements
    this.island = buildFloatingIsland();
    this.scene.add(this.island.islandGroup);

    this.monk = createMeditatingMonk();
    this.scene.add(this.monk.group);

    this.crystal = buildCrystalCluster(this.isSoftwareGl);
    this.scene.add(this.crystal.group);

    this.vegetation = buildVegetationSystem();
    this.scene.add(this.vegetation.group);

    this.particles = buildParticleSystem();
    this.scene.add(this.particles.group);

    // 8. Distant Atmospheric Stars
    this.createStarfield();

    // Initial stage synchronization
    this.setStage(this.currentStage);
    this.setProgress(this.currentProgress);

    // 9. Pre-warm shaders
    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.clock = new THREE.Clock();

    // 10. Start Animation Loop
    this.startLoop();
  }

  private createStarfield() {
    const starCount = 350;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 32.0 + Math.random() * 8.0;

      starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x93b5ff,
      size: 0.18,
      transparent: true,
      opacity: 0.55,
    });
    const starField = new THREE.Points(starGeo, starMat);
    this.scene.add(starField);
  }

  // Loop execution with software WebGL guard
  private startLoop() {
    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.isDestroyed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 60);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (this.isDestroyed) return;
      const delta = Math.min(this.clock.getDelta(), 0.1);
      const elapsed = this.clock.getElapsedTime();

      this.update(delta, elapsed);
      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    tick();
  }

  private update(delta: number, elapsed: number) {
    const stageInfo = SANCTUARY_STAGES[this.currentStage];
    const progressRatio = this.currentProgress / 100;

    // 1. Monk meditative breathing
    this.monk.updateAnimation(elapsed);

    // 2. Crystal pulsing and halo swirling
    this.crystal.updateAnimation(elapsed, progressRatio, stageInfo.crystalIntensity);

    // 3. Vegetation wind sway
    this.vegetation.updateAnimation(elapsed);

    // 4. Floating particles & embers
    this.particles.updateAnimation(delta, elapsed, this.currentStage);

    // 5. Satellite floating rocks bobbing gently
    this.island.satelliteRocksGroup.children.forEach((rock) => {
      const u = rock.userData;
      if (!u) return;
      rock.position.y = u.baseY + Math.sin(elapsed * u.bobSpeed + u.bobOffset) * 0.18;
      rock.rotation.y += delta * u.rotSpeed * 0.2;
      rock.rotation.x += delta * u.rotSpeed * 0.1;
    });

    // 6. Cyan fissure pulsation
    const fissurePulse = 0.5 + 0.5 * Math.sin(elapsed * 2.2);
    const fissureOpacity = Math.min(1.0, 0.4 + stageInfo.fissureGlow * 0.45 + fissurePulse * 0.2);
    this.island.fissureMaterials.forEach((m) => {
      m.opacity = fissureOpacity;
    });
    this.cyanFissureLight1.intensity = (1.4 + stageInfo.fissureGlow * 1.6) * (0.85 + 0.2 * fissurePulse);
    this.cyanFissureLight2.intensity = (1.1 + stageInfo.fissureGlow * 1.3) * (0.85 + 0.2 * fissurePulse);
    this.cyanFissureLight3.intensity = (1.2 + stageInfo.fissureGlow * 1.4) * (0.85 + 0.2 * fissurePulse);

    // 7. Smooth camera preset transition with exponential damping
    if (this.isTransitioningCamera) {
      const dampFactor = 1 - Math.exp(-6.5 * delta);
      this.camera.position.lerp(this.targetCamPos, dampFactor);
      this.controls.target.lerp(this.targetCamLook, dampFactor);

      if (
        this.camera.position.distanceTo(this.targetCamPos) < 0.05 &&
        this.controls.target.distanceTo(this.targetCamLook) < 0.05
      ) {
        this.camera.position.copy(this.targetCamPos);
        this.controls.target.copy(this.targetCamLook);
        this.isTransitioningCamera = false;
      }
    }

    if (!this.isSoftwareGl) {
      this.controls.update();
    }
  }

  // -------------------------------------------------------------
  // Public Control APIs
  // -------------------------------------------------------------
  public setStage(stage: SanctuaryStage) {
    this.currentStage = stage;
    const info = SANCTUARY_STAGES[stage];

    // Update vegetation models & scaling
    this.vegetation.updateStage(stage, this.currentProgress / 100);

    // Adjust lighting mood
    const progressFactor = this.currentProgress / 100;
    this.moonKeyLight.intensity = 1.2 + stage * 0.12;
    this.warmMonkLight.intensity = 1.0 + stage * 0.15;
  }

  public setProgress(progress: number) {
    this.currentProgress = Math.max(0, Math.min(100, progress));
  }

  public setCameraPreset(preset: CameraPreset) {
    this.activePreset = preset;
    const def = CAMERA_PRESETS[preset];
    this.targetCamPos.copy(def.position);
    this.targetCamLook.copy(def.target);
    this.isTransitioningCamera = true;
  }

  public resetCamera() {
    this.setCameraPreset('overview');
  }

  public triggerCompletionEffect() {
    this.particles.triggerBurst();
  }

  public handleResize() {
    if (!this.container || this.isDestroyed) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.isSoftwareGl) {
      clearTimeout(this.frameId);
    } else {
      cancelAnimationFrame(this.frameId);
    }
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
