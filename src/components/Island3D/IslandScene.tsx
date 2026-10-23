import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface IslandSceneProps {
  completionRate?: number;
}

export const IslandScene: React.FC<IslandSceneProps> = ({ completionRate = 50 }) => {
  const islandGroupRef = useRef<THREE.Group>(null);
  const centralCrystalRef = useRef<THREE.Mesh>(null);
  const crystalsGroupRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Glow intensity scale based on completion percentage
  const chargeFactor = Math.max(0.3, completionRate / 100);

  // Generate particle positions
  const particleCount = 120;
  const particlePositions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const radius = 2.2 + Math.random() * 2.8;
      const angle = Math.random() * Math.PI * 2;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.2) * 3.5;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, []);

  // Frame animation loop
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Gentle floating island bobbing
    if (islandGroupRef.current) {
      islandGroupRef.current.position.y = Math.sin(t * 0.9) * 0.12;
      islandGroupRef.current.rotation.y = t * 0.04;
    }

    // Levitating central crystal rotation & pulsation
    if (centralCrystalRef.current) {
      centralCrystalRef.current.rotation.y = -t * 0.7;
      centralCrystalRef.current.rotation.z = Math.sin(t * 1.2) * 0.15;
      centralCrystalRef.current.position.y = 1.35 + Math.sin(t * 1.8) * 0.08;
      
      const mat = centralCrystalRef.current.material as THREE.MeshStandardMaterial;
      if (mat && mat.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = 0.8 + Math.sin(t * 2.5) * 0.3 * chargeFactor;
      }
    }

    // Pulsing glow on perimeter crystals
    if (crystalsGroupRef.current) {
      crystalsGroupRef.current.children.forEach((child, idx) => {
        const mesh = child as THREE.Mesh;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat && mat.emissiveIntensity !== undefined) {
          mat.emissiveIntensity = 0.6 + Math.sin(t * 2 + idx) * 0.4 * chargeFactor;
        }
      });
    }

    // Particles upward drift
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += 0.006;
        if (positions[i * 3 + 1] > 3.5) {
          positions[i * 3 + 1] = -0.5;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Dynamic Lighting */}
      <ambientLight intensity={0.4} color="#6366f1" />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color="#c7d2fe" />
      <directionalLight position={[-5, -2, -5]} intensity={0.3} color="#8b5cf6" />
      
      {/* Central Core Point Light with violet glow */}
      <pointLight 
        position={[0, 1.5, 0]} 
        intensity={2.5 * chargeFactor} 
        color="#8b5cf6" 
        distance={7} 
      />
      {/* Cyan secondary point light */}
      <pointLight 
        position={[1.5, 0.8, -1]} 
        intensity={1.8 * chargeFactor} 
        color="#06b6d4" 
        distance={5} 
      />

      {/* Main Floating Island Group */}
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

        {/* 4. Glowing Neon Circuit Pathways */}
        {/* Central Pathway Stone Ring */}
        <mesh position={[0, 0.27, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.7, 0.85, 16]} />
          <meshStandardMaterial 
            color="#06b6d4" 
            emissive="#06b6d4" 
            emissiveIntensity={1.2 * chargeFactor} 
            roughness={0.3} 
            transparent 
            opacity={0.85} 
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
                emissiveIntensity={0.8 * chargeFactor} 
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
            wireframe={false} 
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
          
          {/* Violet Spire 2 (smaller companion) */}
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

        {/* 7. Luminous Stylized Trees & Flora */}
        {/* Tree 1: Left Grove */}
        <group position={[-1.4, 0.25, -0.5]}>
          {/* Trunk */}
          <mesh position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.07, 0.1, 0.7, 5]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
          {/* Foliage Canopy */}
          <mesh position={[0, 0.85, 0]}>
            <dodecahedronGeometry args={[0.42, 0]} />
            <meshStandardMaterial 
              color="#10b981" 
              emissive="#059669" 
              emissiveIntensity={0.6 * chargeFactor} 
              roughness={0.5} 
              flatShading 
            />
          </mesh>
        </group>

        {/* Tree 2: Deep Violet Blossom Tree */}
        <group position={[0.7, 0.25, 1.4]}>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.06, 0.09, 0.6, 5]} />
            <meshStandardMaterial color="#1e293b" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.72, 0]}>
            <icosahedronGeometry args={[0.36, 0]} />
            <meshStandardMaterial 
              color="#a855f7" 
              emissive="#9333ea" 
              emissiveIntensity={0.8 * chargeFactor} 
              roughness={0.4} 
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
