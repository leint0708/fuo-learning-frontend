import { useState, useCallback } from "react";

export interface UseZoomPanOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  initialZoom?: number;
  onZoomChange?: (zoom: number) => void;
  onPanChange?: (pan: { x: number; y: number }) => void;
}

export function useZoomPan(options: UseZoomPanOptions = {}) {
  const {
    minZoom = 0.5,
    maxZoom = 3.0,
    zoomStep = 0.25,
    initialZoom = 1.25,
    onZoomChange,
    onPanChange,
  } = options;

  const [zoomLevel, setZoomLevel] = useState<number>(initialZoom);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const zoomIn = useCallback(() => {
    setZoomLevel((prev) => {
      const next = Math.min(maxZoom, Number((prev + zoomStep).toFixed(2)));
      onZoomChange?.(next);
      return next;
    });
  }, [maxZoom, zoomStep, onZoomChange]);

  const zoomOut = useCallback(() => {
    setZoomLevel((prev) => {
      const next = Math.max(minZoom, Number((prev - zoomStep).toFixed(2)));
      onZoomChange?.(next);
      return next;
    });
  }, [minZoom, zoomStep, onZoomChange]);

  const resetZoom = useCallback(() => {
    setZoomLevel(initialZoom);
    setPanOffset({ x: 0, y: 0 });
    onZoomChange?.(initialZoom);
    onPanChange?.({ x: 0, y: 0 });
  }, [initialZoom, onZoomChange, onPanChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      setPanOffset((prev) => {
        const next = { x: prev.x + dx, y: prev.y + dy };
        onPanChange?.(next);
        return next;
      });
      setDragStart({ x: e.clientX, y: e.clientY });
    },
    [isDragging, dragStart, onPanChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  return {
    zoomLevel,
    panOffset,
    isDragging,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoomLevel,
    setPanOffset,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    transformStyle: {
      transform: `scale(${zoomLevel}) translate3d(${panOffset.x}px, ${panOffset.y}px, 0)`,
      transformOrigin: "top center",
      transition: isDragging ? "none" : "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
    },
  };
}
