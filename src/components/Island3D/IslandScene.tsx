import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface IslandSceneProps {
  completionRate?: number;
  pulseTrigger?: number; // timestamp triggered on habit completion
}

function generateDeterministicParticles(count: number) {
  const pos = new Float32Array(count * 3);
  const vel = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const seed1 = Math.abs(Math.sin((i + 1) * 12.9898) * 43758.5453) % 1;
    const seed2 = Math.abs(Math.cos((i + 1) * 78.233) * 43758.5453) % 1;
    const seed3 = Math.abs(Math.sin((i + 1) * 45.164) * 43758.5453) % 1;

    const radius = 2.0 + seed1 * 2.6;
    const angle = seed2 * Math.PI * 2;
    pos[i * 3] = Math.cos(angle) * radius;
    pos[i * 3 + 1] = (seed3 - 0.2) * 3.8;
    pos[i * 3 + 2] = Math.sin(angle) * radius;
    vel[i] = 0.004 + seed1 * 0.006;
  }
  return { particlePositions: pos, particleVelocities: vel };
}

export const IslandScene: React.FC<IslandSceneProps> = ({ 
  completionRate = 50,
  pulseTrigger = 0,
}) => {
  const islandGroupRef = useRef<THREE.Group>(null);
  const centralCrystalRef = useRef<THREE.Mesh>(null);
  const crystalsGroupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const pulseRingRef = useRef<THREE.Mesh>(null);
  const tree1Ref = useRef<THREE.Group>(null);
  const tree2Ref = useRef<THREE.Group>(null);
  const tree3Ref = useRef<THREE.Group>(null);

  // Smooth lerped values to prevent abrupt jumps
  const currentCharge = useRef<number>(Math.max(0.3, completionRate / 100));
  const targetCharge = Math.max(0.3, completionRate / 100);

  // Shockwave ring pulse state
  const shockwaveProgress = useRef<number>(1); // 1 = inactive/finished

  // Trigger shockwave pulse on new completion
  useEffect(() => {
    if (pulseTrigger > 0) {
      shockwaveProgress.current = 0;
    }
  }, [pulseTrigger]);

  // Reduced motion preference
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  // Generate particle positions and orbital speeds (pure deterministic)
  const particleCount = 140;
  const { particlePositions, particleVelocities } = useMemo(
    () => generateDeterministicParticles(particleCount),
    [particleCount]
  );

  // Frame animation loop
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const motionFactor = prefersReducedMotion.current ? 0.2 : 1.0;

    // Smoothly interpolate charge towards target
    currentCharge.current = THREE.MathUtils.lerp(currentCharge.current, targetCharge, 0.04);
    const charge = currentCharge.current;

    // 1. Smooth Floating Island Movement & Subtle Mouse Parallax
    if (islandGroupRef.current) {
      // Gentle vertical bobbing & continuous slow yaw
      islandGroupRef.current.position.y = Math.sin(t * 0.8) * (0.12 * motionFactor);
      islandGroupRef.current.rotation.y = t * (0.035 * motionFactor);

      // Mouse-responsive tilt parallax (clamped & smoothly lerped)
      const targetRotX = state.pointer.y * (0.08 * motionFactor);
      const targetRotZ = -state.pointer.x * (0.08 * motionFactor);
      islandGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        islandGroupRef.current.rotation.x,
        targetRotX,
        0.05
      );
      islandGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        islandGroupRef.current.rotation.z,
        targetRotZ,
        0.05
      );
    }

    // 2. Central Crystal: smooth levitation, rotation, scaling & emissive pulse
    if (centralCrystalRef.current) {
      const rotSpeed = 0.6 + charge * 0.4;
      centralCrystalRef.current.rotation.y = -t * (rotSpeed * motionFactor);
      centralCrystalRef.current.rotation.z = Math.sin(t * 1.1) * (0.12 * motionFactor);
      centralCrystalRef.current.position.y = 1.35 + Math.sin(t * 1.6) * (0.07 * motionFactor);

      // Smooth scale response to completion
      const targetScale = 0.95 + charge * 0.3;
      centralCrystalRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale * 1.1, targetScale),
        0.05
      );

      // Emissive pulse
      const mat = centralCrystalRef.current.material as THREE.MeshStandardMaterial;
      if (mat && mat.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = 0.9 + Math.sin(t * 2.2) * 0.3 * charge;
      }
    }

    // 3. Glowing Pathways & Concentric Circuit Rings
    if (innerRingRef.current) {
      innerRingRef.current.rotation.z = t * (0.18 * motionFactor);
      const ringMat = innerRingRef.current.material as THREE.MeshStandardMaterial;
      if (ringMat) {
        ringMat.emissiveIntensity = 0.8 + Math.sin(t * 2.0) * 0.3 * charge;
      }
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = -t * (0.12 * motionFactor);
      const ringMat = outerRingRef.current.material as THREE.MeshStandardMaterial;
      if (ringMat) {
        ringMat.emissiveIntensity = 0.6 + Math.cos(t * 1.8) * 0.25 * charge;
      }
    }

    // 4. Habit Completion Shockwave Ring Expansion
    if (pulseRingRef.current && shockwaveProgress.current < 1) {
      shockwaveProgress.current += delta * 1.2;
      const p = Math.min(1, shockwaveProgress.current);
      // Expand from 0.8 to 2.6
      const s = THREE.MathUtils.lerp(0.8, 2.6, Math.sqrt(p));
      pulseRingRef.current.scale.set(s, s, s);

      const pMat = pulseRingRef.current.material as THREE.MeshStandardMaterial;
      if (pMat) {
        // Fade out as it expands
        pMat.opacity = (1 - p) * 0.85;
        pMat.emissiveIntensity = (1 - p) * 2.5;
      }
    } else if (pulseRingRef.current && shockwaveProgress.current >= 1) {
      const pMat = pulseRingRef.current.material as THREE.MeshStandardMaterial;
      if (pMat) pMat.opacity = 0;
    }

    // 5. Swaying Luminous Plants & Trees
    if (tree1Ref.current) {
      tree1Ref.current.rotation.z = Math.sin(t * 1.4) * (0.04 * motionFactor);
      tree1Ref.current.rotation.x = Math.cos(t * 1.1) * (0.03 * motionFactor);
    }
    if (tree2Ref.current) {
      tree2Ref.current.rotation.z = Math.sin(t * 1.2 + 1.0) * (0.045 * motionFactor);
      tree2Ref.current.rotation.x = Math.cos(t * 0.9 + 0.5) * (0.03 * motionFactor);
    }
    if (tree3Ref.current) {
      tree3Ref.current.rotation.z = Math.sin(t * 1.5 + 2.0) * (0.035 * motionFactor);
    }

    // 6. Perimeter Crystals Pulsing Glow
    if (crystalsGroupRef.current) {
      crystalsGroupRef.current.children.forEach((child, idx) => {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat && mat.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = 0.6 + Math.sin(t * 1.8 + idx * 0.8) * 0.4 * charge;
        }
      });
    }

    // 7. Slow-Moving Ambient Luminous Particles
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        // Upward gentle drift
        positions[i * 3 + 1] += particleVelocities[i] * motionFactor;
        // Subtle orbital rotation around Y
        const x = positions[i * 3];
        const z = positions[i * 3 + 2];
        const angle = 0.002 * motionFactor;
        positions[i * 3] = x * Math.cos(angle) - z * Math.sin(angle);
        positions[i * 3 + 2] = x * Math.sin(angle) + z * Math.cos(angle);

        // Reset if drifted too high
        if (positions[i * 3 + 1] > 3.6) {
          positions[i * 3 + 1] = -0.4;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Dynamic Lighting */}
      <ambientLight intensity={0.45} color="#6366f1" />
      <directionalLight position={[5, 8, 5]} intensity={1.3} color="#c7d2fe" />
      <directionalLight position={[-5, -2, -5]} intensity={0.35} color="#8b5cf6" />
      
      {/* Central Core Point Light with violet glow */}
      <pointLight 
        position={[0, 1.5, 0]} 
        intensity={2.8 * targetCharge} 
        color="#8b5cf6" 
        distance={7.5} 
      />
      {/* Cyan secondary point light */}
      <pointLight 
        position={[1.5, 0.8, -1]} 
        intensity={2.0 * targetCharge} 
        color="#06b6d4" 
        distance={5.5} 
      />

      {/* Main Floating Island Group with parallax tilt */}
      <group ref={islandGroupRef} position={[0, -0.4, 0]}>
        
        {/* 1. Faceted Inverted Rock Base (Dark Charcoal / Slate) */}
        <mesh position={[0, -0.9, 0]}>
          <cylinderGeometry args={[2.5, 0.2, 2.0, 7]} />
          <meshStandardMaterial 
            color="#141724" 
            roughness={0.85} 
            metalness={0.15} 
            flatShading 
          />
        </mesh>

        {/* 2. Secondary lower rock cluster */}
        <mesh position={[0.4, -1.8, -0.2]}>
          <coneGeometry args={[0.5, 1.2, 5]} />
          <meshStandardMaterial color="#0f111a" roughness={0.9} flatShading />
        </mesh>

        {/* 3. Top Moss / Plateau Layer (Subtle Cosmic Emerald / Violet-Slate) */}
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[2.55, 2.45, 0.28, 7]} />
          <meshStandardMaterial 
            color="#192338" 
            roughness={0.7} 
            metalness={0.2} 
            flatShading 
          />
        </mesh>

        {/* 4. Animated Glowing Pathways & Rings */}
        {/* Inner Concentric Circuit Ring */}
        <mesh ref={innerRingRef} position={[0, 0.27, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.65, 0.82, 24]} />
          <meshStandardMaterial 
            color="#06b6d4" 
            emissive="#06b6d4" 
            emissiveIntensity={1.2} 
            roughness={0.3} 
            transparent 
            opacity={0.9} 
          />
        </mesh>

        {/* Outer Concentric Circuit Ring */}
        <mesh ref={outerRingRef} position={[0, 0.268, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.32, 24]} />
          <meshStandardMaterial 
            color="#8b5cf6" 
            emissive="#8b5cf6" 
            emissiveIntensity={0.8} 
            roughness={0.3} 
            transparent 
            opacity={0.7} 
          />
        </mesh>

        {/* Shockwave Habit Completion Pulse Ring */}
        <mesh ref={pulseRingRef} position={[0, 0.272, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.95, 1.05, 32]} />
          <meshStandardMaterial 
            color="#22d3ee" 
            emissive="#06b6d4" 
            emissiveIntensity={2.5} 
            transparent 
            opacity={0} 
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Radiating Stepping Path Stones */}
        {[0, 1, 2, 3].map((idx) => {
          const angle = (idx * Math.PI) / 2 + 0.3;
          const x = Math.cos(angle) * 1.5;
          const z = Math.sin(angle) * 1.5;
          return (
            <mesh key={`path-${idx}`} position={[x, 0.28, z]}>
              <cylinderGeometry args={[0.22, 0.26, 0.06, 6]} />
              <meshStandardMaterial 
                color="#0ea5e9" 
                emissive="#06b6d4" 
                emissiveIntensity={0.9 * targetCharge} 
                roughness={0.4} 
              />
            </mesh>
          );
        })}

        {/* 5. Central Levitating Monolith Crystal */}
        <mesh ref={centralCrystalRef} position={[0, 1.35, 0]}>
          <octahedronGeometry args={[0.48, 0]} />
          <meshStandardMaterial 
            color="#a855f7" 
            emissive="#8b5cf6" 
            emissiveIntensity={1.4} 
            roughness={0.1} 
            metalness={0.8} 
          />
        </mesh>

        {/* Central Altar Pedestal */}
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.5, 0.65, 0.45, 6]} />
          <meshStandardMaterial color="#1e1b4b" roughness={0.6} metalness={0.4} flatShading />
        </mesh>

        {/* 6. Glowing Crystals Group around the Island */}
        <group ref={crystalsGroupRef}>
          {/* Violet Spire 1 */}
          <mesh position={[1.4, 0.55, 0.7]} rotation={[0.1, 0.2, -0.15]}>
            <coneGeometry args={[0.18, 0.85, 5]} />
            <meshStandardMaterial 
              color="#c084fc" 
              emissive="#8b5cf6" 
              emissiveIntensity={1.0} 
              roughness={0.2} 
            />
          </mesh>
          
          {/* Violet Spire 2 */}
          <mesh position={[1.65, 0.42, 0.5]} rotation={[-0.1, -0.3, 0.2]}>
            <coneGeometry args={[0.12, 0.55, 4]} />
            <meshStandardMaterial 
              color="#d8b4fe" 
              emissive="#a855f7" 
              emissiveIntensity={1.2} 
              roughness={0.2} 
            />
          </mesh>

          {/* Cyan Crystal Cluster */}
          <mesh position={[-1.3, 0.5, 0.9]} rotation={[-0.2, 0.1, 0.25]}>
            <octahedronGeometry args={[0.26, 0]} />
            <meshStandardMaterial 
              color="#22d3ee" 
              emissive="#06b6d4" 
              emissiveIntensity={1.1} 
              roughness={0.15} 
            />
          </mesh>

          {/* Deep Violet Crystal North */}
          <mesh position={[-0.8, 0.6, -1.4]} rotation={[0.25, 0.4, -0.1]}>
            <coneGeometry args={[0.2, 0.95, 6]} />
            <meshStandardMaterial 
              color="#a855f7" 
              emissive="#7c3aed" 
              emissiveIntensity={1.0} 
              roughness={0.2} 
            />
          </mesh>

          {/* Amber/Gold Accent Crystal */}
          <mesh position={[1.2, 0.45, -1.2]} rotation={[-0.15, -0.2, -0.2]}>
            <octahedronGeometry args={[0.22, 0]} />
            <meshStandardMaterial 
              color="#38bdf8" 
              emissive="#0284c7" 
              emissiveIntensity={0.9} 
              roughness={0.2} 
            />
          </mesh>
        </group>

        {/* 7. Luminous Stylized Trees & Swaying Flora */}
        {/* Tree 1: Left Emerald Grove */}
        <group ref={tree1Ref} position={[-1.4, 0.25, -0.5]}>
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.07, 0.1, 0.7, 5]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <dodecahedronGeometry args={[0.42, 0]} />
            <meshStandardMaterial 
              color="#10b981" 
              emissive="#059669" 
              emissiveIntensity={0.6 * targetCharge} 
              roughness={0.5} 
              flatShading 
            />
          </mesh>
        </group>

        {/* Tree 2: Deep Violet Blossom Tree */}
        <group ref={tree2Ref} position={[0.7, 0.25, 1.4]}>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.06, 0.09, 0.6, 5]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <icosahedronGeometry args={[0.36, 0]} />
            <meshStandardMaterial 
              color="#a855f7" 
              emissive="#9333ea" 
              emissiveIntensity={0.8 * targetCharge} 
              roughness={0.4} 
              flatShading 
            />
          </mesh>
        </group>

        {/* Tree 3: Cyan Sprout */}
        <group ref={tree3Ref} position={[-0.5, 0.25, 1.2]}>
          <mesh position={[0, 0.2, 0]}>
            <cylinderGeometry args={[0.04, 0.06, 0.4, 5]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.48, 0]}>
            <octahedronGeometry args={[0.22, 0]} />
            <meshStandardMaterial 
              color="#06b6d4" 
              emissive="#0891b2" 
              emissiveIntensity={0.7 * targetCharge} 
              roughness={0.3} 
              flatShading 
            />
          </mesh>
        </group>

        {/* 8. Floating Ambient Spores / Particles */}
        <points ref={particlesRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[particlePositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.065}
            color="#a78bfa"
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
          />
        </points>

      </group>
    </>
  );
};
