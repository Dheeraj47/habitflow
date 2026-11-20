import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Crop,
  Check,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Maximize2,
  Sparkles
} from 'lucide-react';
import {
  type NormalizedCrop,
  CROP_ASPECT_PRESETS,
  calculateInitialCrop,
  clampCrop,
  renderCroppedDataUrl,
} from '../utils/cropUtils';

interface ImageCropModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  pageTitle?: string;
  onClose: () => void;
  onApplyCrop: (croppedDataUrl: string) => void;
}

type DragMode = 'move' | 'nw' | 'ne' | 'se' | 'sw' | null;

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageUrl,
  pageTitle,
  onClose,
  onApplyCrop,
}) => {
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<number | null>(2.8);
  const [crop, setCrop] = useState<NormalizedCrop>({ x: 0, y: 0.2, width: 1, height: 0.35 });
  const [zoom, setZoom] = useState<number>(1);
  const [isApplying, setIsApplying] = useState(false);

  // References
  const stageRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const dragStartRef = useRef<{
    mode: DragMode;
    pointerX: number;
    pointerY: number;
    cropStart: NormalizedCrop;
  } | null>(null);

  // 1. Load Image from URL or Data URL
  useEffect(() => {
    if (!isOpen || !imageUrl) {
      setLoadedImg(null);
      setLoadError(null);
      return;
    }

    setLoadError(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      setLoadedImg(img);
      const initial = calculateInitialCrop(img.naturalWidth, img.naturalHeight, selectedAspect);
      setCrop(initial);
      setZoom(1);
    };

    img.onerror = () => {
      setLoadError('Failed to load image. The image may be corrupted or blocked by cross-origin restrictions.');
    };

    img.src = imageUrl;
  }, [isOpen, imageUrl, selectedAspect]);

  // 2. Aspect Ratio Change Handler
  const handleAspectChange = (aspect: number | null) => {
    setSelectedAspect(aspect);
    if (!loadedImg) return;
    const initial = calculateInitialCrop(loadedImg.naturalWidth, loadedImg.naturalHeight, aspect);
    setCrop(initial);
    setZoom(1);
  };

  // 3. Zoom Slider Handler
  const handleZoomChange = (newZoom: number) => {
    if (!loadedImg) return;
    const clampedZoom = Math.max(1, Math.min(3, newZoom));
    setZoom(clampedZoom);

    const base = calculateInitialCrop(loadedImg.naturalWidth, loadedImg.naturalHeight, selectedAspect);
    const scale = 1 / clampedZoom;
    const newWidth = Math.max(0.08, base.width * scale);
    const newHeight = Math.max(0.05, base.height * scale);

    // Keep center anchored
    const currentCenterX = crop.x + crop.width / 2;
    const currentCenterY = crop.y + crop.height / 2;

    const newX = Math.max(0, Math.min(1 - newWidth, currentCenterX - newWidth / 2));
    const newY = Math.max(0, Math.min(1 - newHeight, currentCenterY - newHeight / 2));

    setCrop(clampCrop({ x: newX, y: newY, width: newWidth, height: newHeight }));
  };

  // 4. Reset to Default
  const handleReset = () => {
    if (!loadedImg) return;
    const initial = calculateInitialCrop(loadedImg.naturalWidth, loadedImg.naturalHeight, selectedAspect);
    setCrop(initial);
    setZoom(1);
  };

  // 5. Live Banner Preview Rendering
  useEffect(() => {
    if (!loadedImg || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const targetW = 800;
    const effectiveAspect = selectedAspect || (crop.width / crop.height * (loadedImg.naturalWidth / loadedImg.naturalHeight));
    const targetH = Math.max(100, Math.round(targetW / effectiveAspect));

    canvas.width = targetW;
    canvas.height = targetH;

    const sx = Math.round(crop.x * loadedImg.naturalWidth);
    const sy = Math.round(crop.y * loadedImg.naturalHeight);
    const sw = Math.round(crop.width * loadedImg.naturalWidth);
    const sh = Math.round(crop.height * loadedImg.naturalHeight);

    ctx.drawImage(loadedImg, sx, sy, sw, sh, 0, 0, targetW, targetH);
  }, [crop, loadedImg, selectedAspect]);

  // 6. Interactive Drag & Resize Handling
  const handlePointerDown = (mode: DragMode, clientX: number, clientY: number) => {
    if (!stageRef.current) return;
    dragStartRef.current = {
      mode,
      pointerX: clientX,
      pointerY: clientY,
      cropStart: { ...crop },
    };
  };

  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!dragStartRef.current || !stageRef.current || !loadedImg) return;
    const { mode, pointerX, pointerY, cropStart } = dragStartRef.current;
    const rect = stageRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const deltaX = (clientX - pointerX) / rect.width;
    const deltaY = (clientY - pointerY) / rect.height;

    const imgAspect = loadedImg.naturalWidth / loadedImg.naturalHeight;

    if (mode === 'move') {
      const newX = Math.max(0, Math.min(1 - cropStart.width, cropStart.x + deltaX));
      const newY = Math.max(0, Math.min(1 - cropStart.height, cropStart.y + deltaY));
      setCrop((prev) => ({ ...prev, x: newX, y: newY }));
    } else if (mode === 'se') {
      // Dragging bottom-right
      let newW = Math.max(0.1, Math.min(1 - cropStart.x, cropStart.width + deltaX));
      let newH = selectedAspect
        ? (newW * imgAspect) / selectedAspect
        : Math.max(0.05, Math.min(1 - cropStart.y, cropStart.height + deltaY));

      if (cropStart.y + newH > 1) {
        newH = 1 - cropStart.y;
        if (selectedAspect) {
          newW = (newH * selectedAspect) / imgAspect;
        }
      }
      setCrop((prev) => clampCrop({ ...prev, width: newW, height: newH }));
    } else if (mode === 'sw') {
      // Dragging bottom-left
      let newW = Math.max(0.1, Math.min(cropStart.x + cropStart.width, cropStart.width - deltaX));
      let newH = selectedAspect
        ? (newW * imgAspect) / selectedAspect
        : Math.max(0.05, Math.min(1 - cropStart.y, cropStart.height + deltaY));

      if (cropStart.y + newH > 1) {
        newH = 1 - cropStart.y;
        if (selectedAspect) {
          newW = (newH * selectedAspect) / imgAspect;
        }
      }
      const newX = cropStart.x + (cropStart.width - newW);
      setCrop((prev) => clampCrop({ ...prev, x: newX, width: newW, height: newH }));
    } else if (mode === 'ne') {
      // Dragging top-right
      let newW = Math.max(0.1, Math.min(1 - cropStart.x, cropStart.width + deltaX));
      let newH = selectedAspect
        ? (newW * imgAspect) / selectedAspect
        : Math.max(0.05, cropStart.height - deltaY);

      const newY = cropStart.y + (cropStart.height - newH);
      if (newY < 0) {
        newH = cropStart.y + cropStart.height;
        if (selectedAspect) {
          newW = (newH * selectedAspect) / imgAspect;
        }
      }
      const finalY = Math.max(0, cropStart.y + (cropStart.height - newH));
      setCrop((prev) => clampCrop({ ...prev, y: finalY, width: newW, height: newH }));
    } else if (mode === 'nw') {
      // Dragging top-left
      let newW = Math.max(0.1, Math.min(cropStart.x + cropStart.width, cropStart.width - deltaX));
      let newH = selectedAspect
        ? (newW * imgAspect) / selectedAspect
        : Math.max(0.05, cropStart.height - deltaY);

      let newX = cropStart.x + (cropStart.width - newW);
      let newY = cropStart.y + (cropStart.height - newH);

      if (newX < 0) newX = 0;
      if (newY < 0) newY = 0;

      setCrop((prev) => clampCrop({ ...prev, x: newX, y: newY, width: newW, height: newH }));
    }
  }, [loadedImg, selectedAspect]);

  const handlePointerUp = useCallback(() => {
    dragStartRef.current = null;
  }, []);

  // Global mouse & touch listeners for smooth dragging outside element bounds
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = () => handlePointerUp();
    const onTouchMove = (e: TouchEvent) => {
      if (dragStartRef.current && e.touches[0]) {
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const onTouchEnd = () => handlePointerUp();

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [handlePointerMove, handlePointerUp]);

  // 7. Apply Crop Action
  const handleApply = async () => {
    if (!loadedImg) return;
    setIsApplying(true);
    try {
      const croppedDataUrl = renderCroppedDataUrl(loadedImg, crop, 1920);
      onApplyCrop(croppedDataUrl);
      onClose();
    } catch (err) {
      console.error('Failed to crop image:', err);
      setLoadError('Failed to export cropped image.');
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <div
        className="w-full max-w-3xl bg-[#0b0f19] border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-[#0f1422]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Crop className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 id="crop-modal-title" className="text-sm font-bold text-white tracking-wide">
                Crop & Frame Cover Image
              </h2>
              <p className="text-[11px] text-slate-400">
                Drag the highlighted frame to choose what part of your image will be visible in the banner.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {loadError ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center space-y-2">
              <p>{loadError}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          ) : !loadedImg ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading image preview...</p>
            </div>
          ) : (
            <>
              {/* Interactive Cropper Stage */}
              <div className="relative w-full h-[280px] sm:h-[350px] bg-[#05070c] rounded-xl overflow-hidden flex items-center justify-center border border-slate-800/80 shadow-inner">
                {/* Image & Crop Container scaled to exact natural aspect ratio */}
                <div
                  ref={stageRef}
                  className="relative select-none"
                  style={{
                    aspectRatio: `${loadedImg.naturalWidth} / ${loadedImg.naturalHeight}`,
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: 'auto',
                    height: 'auto',
                  }}
                >
                  {/* Background Image */}
                  <img
                    src={loadedImg.src}
                    alt="Source to crop"
                    className="w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />

                  {/* Dimmed Masks (Top, Bottom, Left, Right) */}
                  <div
                    className="absolute bg-black/65 pointer-events-none transition-all duration-75"
                    style={{
                      top: 0,
                      left: 0,
                      right: 0,
                      height: `${crop.y * 100}%`,
                    }}
                  />
                  <div
                    className="absolute bg-black/65 pointer-events-none transition-all duration-75"
                    style={{
                      top: `${(crop.y + crop.height) * 100}%`,
                      left: 0,
                      right: 0,
                      bottom: 0,
                    }}
                  />
                  <div
                    className="absolute bg-black/65 pointer-events-none transition-all duration-75"
                    style={{
                      top: `${crop.y * 100}%`,
                      left: 0,
                      width: `${crop.x * 100}%`,
                      height: `${crop.height * 100}%`,
                    }}
                  />
                  <div
                    className="absolute bg-black/65 pointer-events-none transition-all duration-75"
                    style={{
                      top: `${crop.y * 100}%`,
                      left: `${(crop.x + crop.width) * 100}%`,
                      right: 0,
                      height: `${crop.height * 100}%`,
                    }}
                  />

                  {/* Active Crop Frame */}
                  <div
                    className="absolute border-2 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.6)] cursor-move group select-none"
                    style={{
                      left: `${crop.x * 100}%`,
                      top: `${crop.y * 100}%`,
                      width: `${crop.width * 100}%`,
                      height: `${crop.height * 100}%`,
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handlePointerDown('move', e.clientX, e.clientY);
                    }}
                    onTouchStart={(e) => {
                      if (e.touches[0]) {
                        handlePointerDown('move', e.touches[0].clientX, e.touches[0].clientY);
                      }
                    }}
                  >
                    {/* 3x3 Rule-of-Thirds Grid */}
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-r border-b border-white" />
                      <div className="border-b border-white" />
                      <div className="border-r border-white" />
                      <div className="border-r border-white" />
                      <div />
                    </div>

                    {/* Move Center Badge on Hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="px-2 py-1 rounded bg-black/70 backdrop-blur-sm border border-white/20 text-white text-[10px] flex items-center gap-1 shadow">
                        <Move className="w-3 h-3 text-indigo-400" />
                        <span>Drag to reposition</span>
                      </div>
                    </div>

                    {/* Corner Handles */}
                    {/* NW */}
                    <div
                      className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full cursor-nwse-resize shadow active:scale-125"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handlePointerDown('nw', e.clientX, e.clientY);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        if (e.touches[0]) {
                          handlePointerDown('nw', e.touches[0].clientX, e.touches[0].clientY);
                        }
                      }}
                    />
                    {/* NE */}
                    <div
                      className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full cursor-nesw-resize shadow active:scale-125"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handlePointerDown('ne', e.clientX, e.clientY);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        if (e.touches[0]) {
                          handlePointerDown('ne', e.touches[0].clientX, e.touches[0].clientY);
                        }
                      }}
                    />
                    {/* SE */}
                    <div
                      className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full cursor-nwse-resize shadow active:scale-125"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handlePointerDown('se', e.clientX, e.clientY);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        if (e.touches[0]) {
                          handlePointerDown('se', e.touches[0].clientX, e.touches[0].clientY);
                        }
                      }}
                    />
                    {/* SW */}
                    <div
                      className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-indigo-500 border-2 border-white rounded-full cursor-nesw-resize shadow active:scale-125"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handlePointerDown('sw', e.clientX, e.clientY);
                      }}
                      onTouchStart={(e) => {
                        e.stopPropagation();
                        if (e.touches[0]) {
                          handlePointerDown('sw', e.touches[0].clientX, e.touches[0].clientY);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Toolbar Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#0f1422] border border-slate-800">
                {/* Aspect Ratio Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
                    Ratio:
                  </span>
                  <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
                    {CROP_ASPECT_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleAspectChange(preset.value)}
                        className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all cursor-pointer ${
                          selectedAspect === preset.value
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zoom & Reset Controls */}
                <div className="flex items-center gap-3">
                  {/* Zoom Slider */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleZoomChange(zoom - 0.2)}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={zoom}
                      onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                      className="w-20 sm:w-28 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleZoomChange(zoom + 0.2)}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] text-slate-400 w-8 text-right font-mono">
                      {zoom.toFixed(1)}x
                    </span>
                  </div>

                  {/* Reset Button */}
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer transition-colors"
                    title="Reset to default centered crop"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Real-time Banner Live Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="font-semibold text-slate-300">Live Document Banner Preview</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    Exact view of how this will look on your page
                  </span>
                </div>
                <div className="relative h-24 sm:h-28 w-full rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-md">
                  <canvas ref={previewCanvasRef} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#090d16] via-transparent to-black/30 pointer-events-none" />
                  <div className="absolute bottom-2.5 left-3.5 flex items-center gap-2 pointer-events-none drop-shadow-md">
                    <span className="text-sm">📄</span>
                    <span className="text-xs font-semibold text-white/95">
                      {pageTitle || 'Personal Document'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800/80 bg-[#0f1422]">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
            <span>
              {loadedImg
                ? `Resolution: ${Math.round(crop.width * loadedImg.naturalWidth)} × ${Math.round(crop.height * loadedImg.naturalHeight)} px`
                : ''}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isApplying}
              className="px-3.5 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!loadedImg || isApplying}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all cursor-pointer active:scale-95"
            >
              {isApplying ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              )}
              <span>Apply & Set Cover</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
