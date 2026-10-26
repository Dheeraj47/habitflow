# HabitFlow — The Living Sanctuary: Art-Direction Upgrade

A high-fidelity visual and material overhaul of the 3D sanctuary environment in Three.js, elevating the floating island from a low-poly aesthetic to a semi-realistic fantasy game world while preserving all habit mechanics, 5 growth stages, audio synthesis, camera presets, and interactive controls.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following aesthetic and architectural directions have been confirmed and will directly govern the 3D scene execution:

- **Confirmed Decision 1 (Sacred Amethyst Cluster)**: Use physical refractive transmission (`MeshPhysicalMaterial` with transmission, clearcoat, and attenuation) with beveled hexagonal crystal facets, darker violet edge accents, and an inner lavender emissive core.
- **Confirmed Decision 2 (Meditating Monk Character)**: Implement draped Buddhist saffron robes with sculpted fabric fold geometry, defined praying hands clasped in authentic dhyana mudra (lap meditation posture with meeting thumbs), and tranquil facial anatomy with breathing animation.
- **Confirmed Decision 3 (Terrain & Flora)**: Layer organic moss hummocks with exposed dark loam soil patches, delicate wild ferns, river pebbles, and natural elevation berms transitioning smoothly into the craggy rock cliff rim.
- **Confirmed Decision 4 (Underside & Energy Fissures)**: Deepen geological rock strata with stepped overhangs and crags, embedding glowing cyan bioluminescent fissure conduits that cast realistic ambient radiance onto surrounding rocks.
- **Confirmed Decision 5 (Strict Functional Preservation)**: Retain 100% of the existing React habit dashboard, habit completion cards, XP calculations, streak tracking, growth stage progression (Stages 1–5), camera orbit/zoom presets, and Web Audio synthesis.

---

## 1. Overview & Core Concept

- **What It Does**: HabitFlow connects daily personal habit completion with a living, evolving 3D sanctuary. As daily habits are marked complete, the sacred amethyst crystal pulses with resonant violet energy, cyan fissures ignite subterranean power, and the floating island flourishes through five distinct evolutionary stages.
- **Target Audience / Persona**: Individuals seeking a calm, gamified habit tracker that rewards mindfulness and self-discipline with breathtaking real-time visual progress.
- **Key Value**: Replaces uninspiring checklists with an ancient floating sanctuary that physically mirrors user consistency, combining serene visual art direction with zero-lag habit tracking.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Arrival & Orbit**: The user lands in a cinematic three-quarter overview of the floating sanctuary. The island is comfortably centered in the upper viewport with its rocky underside and tapered stalactite visible.
2. **Habit Engagement**: Checking off a habit triggers instant rewarding Web Audio chime tones, an XP burst floating notification, and an energetic resonance surge through the crystal cluster and fissures.
3. **Camera Exploration**: Clicking camera presets (`Overview`, `Monk Focus`, `Fissures`, `Canopy`) smoothly glides the camera using exponential damping without interrupting the scene.
4. **Stage Milestones**: Advancing through Stages 1 through 5 introduces lush vegetation, blooming mountain flora, radiant celestial nebulas, and cascading light motes.

### Visual Identity & Theme

- **Color Palette & Atmospheric Lighting**:
  - `Midnight Abyss` (`#070a14` to `#0d1326`): Deep cosmic background gradient and subtle horizon fog.
  - `Amethyst & Lavender` (`#6e2fe0`, `#9b62ff`, `#d6b4fc`): Sacred crystal cluster with refractive clarity and soft inner luminescence.
  - `Bioluminescent Cyan` (`#00f0ff`, `#33ffff`): Ancient subterranean energy veins illuminating rock clefts.
  - `Burnt Saffron & Golden Ochre` (`#9e3f1c`, `#d4882c`): Monastic robes with warm cloth scattering and golden aura highlights.
  - `Emerald Moss & Rich Loam` (`#2d5233`, `#1b3a24`, `#2b2017`): Organic ground cover, moss hummocks, and weathered stone.
- **UI Composition**:
  - Unobstructed 3D viewport with all dashboard and camera controls arranged in an ergonomic, non-occluding bottom dock and header badge.
  - Clean static typographic badges and subtle glowing indicators (no distracting pulsating CSS dots).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Procedural High-Fidelity Geometry vs. Unverified External Models**
  - *Chosen Approach*: Construct refined multi-part procedural geometries (`THREE.Group` with 8–14 coordinated elements per actor) using mathematical splines, faceted hexagonal quartz buffers, and sculpted cloth sweeps.
  - *Why*: Eliminates broken 404 network requests, slow download latency, and missing CORS licenses while guaranteeing full run-time control over materials, colors, and animations.
  - *Alternatives Considered*: External GLTF assets were ruled out due to network dependency and styling mismatches with the existing island.

- **Decision 2: Optical PBR Transmission with Software-WebGL Guard**
  - *Chosen Approach*: Apply `MeshPhysicalMaterial` with `transmission: 0.88`, `roughness: 0.18`, and `clearcoat: 0.8` on GPU devices, while automatically falling back to an elegant high-specular transparent material on software-rendered WebGL (SwiftShader) via `isSoftwareGl`.
  - *Why*: Guarantees breathtaking physical light refraction on modern GPUs while maintaining responsive frame rates and fast screenshot rendering during headless verification.

- **Decision 3: Seamless Terrain & Underside Geological Fusion**
  - *Chosen Approach*: Maintain exact matching boundary harmonics between the upper terrain ring and the open-ended cylinder underside, complemented by scattered river stones and moss berms along the perimeter seam.
  - *Why*: Prevents polygonal clipping artifacts while giving the island a monolithic, ancient stone silhouette.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        HABITFLOW WEB APPLICATION                       │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   ┌───────────────────────────────┐   ┌────────────────────────────┐   │
│   │       React Application       │   │    Web Audio Synthesizer   │   │
│   │     (State, Habits, XP)       │   │   (Chimes, Resonances)     │   │
│   └───────────────┬───────────────┘   └─────────────┬──────────────┘   │
│                   │                                 │                  │
│                   ▼                                 ▼                  │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                     SanctuaryScene Controller                  │   │
│   │              (Render Loop, Lighting Rig, PMREM Env)            │   │
│   └──────┬───────────────┬───────────────┬──────────────────┬──────┘   │
│          │               │               │                  │          │
│          ▼               ▼               ▼                  ▼          │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    ┌─────────────┐   │
│   │ Amethyst    │ │ Meditating  │ │ Island      │    │ Flora &     │   │
│   │ Crystal     │ │ Monk        │ │ Geology &   │    │ Dynamic     │   │
│   │ Cluster     │ │ (Padmasana) │ │ Underside   │    │ Particles   │   │
│   │ (Physical)  │ │ (Kesa Robe) │ │ (Fissures)  │    │ (5 Stages)  │   │
│   └─────────────┘ └─────────────┘ └─────────────┘    └─────────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Module Responsibilities & Implementation Steps

1. **`src/world/crystal.ts`**:
   - Upgrade geometry to faceted hexagonal quartz spires with natural crystalline cleavage, asymmetrical crystal twins, and clustered basal druse crystals.
   - Configure `MeshPhysicalMaterial` with refractive transmission, subtle violet dispersion, clearcoat sheen, and an emissive inner lavender core.
   - Violet point light casting dynamic illumination onto monk and terrain.

2. **`src/world/monk.ts`**:
   - Refine monk proportions with authentic padmasana folded legs and zafu meditation cushion.
   - Add sculpted monastic kesa robe folds sweeping diagonally across the chest and over the left shoulder.
   - Sculpt expressive hands resting in lap with dhyana mudra (overlapping palms and touching thumb tips).
   - Calm facial features with gentle eyelids, serene mouth, and subtle forehead urna mark.

3. **`src/world/islandGeometry.ts`**:
   - Enrich upper terrain with multi-layered moss hummocks, dark loam soil patches, scattered river pebbles, and fern fronds.
   - Enhance the underside geological strata with stepped basalt shelves, deep clefts, and crags descending to the tapered stalactite tip.
   - Reinforce glowing cyan energy fissure paths with dual-core emissive tubes and soft light spill.

4. **`src/world/vegetation.ts`**:
   - Refine ancient bonsai trees, gnarled roots, layered canopies, wild mountain flowers, and bioluminescent mushrooms across growth stages 1 through 5.

5. **`src/world/SanctuaryScene.ts`**:
   - Fine-tune 3-point lighting rig: cool moonlight directional key light with soft shadow map, warm monk accent light, violet crystal radiance, and cyan fissure bounce.
   - Pre-warm shaders and ensure smooth exponential camera dampening.
