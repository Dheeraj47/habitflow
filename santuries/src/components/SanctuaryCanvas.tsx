import React, { useEffect, useRef } from 'react';
import { SanctuarySceneManager, CameraPreset } from '../world/SanctuaryScene';
import { SanctuaryStage } from '../utils/habitRules';

interface SanctuaryCanvasProps {
  stage: SanctuaryStage;
  progress: number;
  cameraPreset: CameraPreset;
  sceneManagerRef: React.MutableRefObject<SanctuarySceneManager | null>;
}

export const SanctuaryCanvas: React.FC<SanctuaryCanvasProps> = ({
  stage,
  progress,
  cameraPreset,
  sceneManagerRef,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const manager = new SanctuarySceneManager(mountRef.current);
    sceneManagerRef.current = manager;
    (window as any).__sanctuaryScene = manager;

    const handleResize = () => {
      manager.handleResize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      manager.destroy();
      sceneManagerRef.current = null;
    };
  }, []);

  // Update stage when it changes
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setStage(stage);
    }
  }, [stage]);

  // Update progress when it changes
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setProgress(progress);
    }
  }, [progress]);

  // Update camera preset
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setCameraPreset(cameraPreset);
    }
  }, [cameraPreset]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
      data-testid="sanctuary-3d-canvas"
    />
  );
};
