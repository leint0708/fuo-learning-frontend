import { useState, useCallback, useRef, useEffect } from "react";

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
    initialZoom = 1.0,
    onZoomChange,
    onPanChange,
  } = options;

  const [zoomLevel, setZoomLevel] = useState<number>(initialZoom);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement | null>(null);

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

  const handleWheel = useCallback(
    (e: React.WheelEvent | WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (typeof e.preventDefault === "function") {
          e.preventDefault();
        }
        if (e.deltaY < 0) {
          // Scrolling up -> zoom in
          setZoomLevel((prev) => {
            const next = Math.min(maxZoom, Number((prev + zoomStep).toFixed(2)));
            onZoomChange?.(next);
            return next;
          });
        } else if (e.deltaY > 0) {
          // Scrolling down -> zoom out
          setZoomLevel((prev) => {
            const next = Math.max(minZoom, Number((prev - zoomStep).toFixed(2)));
            onZoomChange?.(next);
            return next;
          });
        }
      }
    },
    [maxZoom, minZoom, zoomStep, onZoomChange]
  );

  // Attach non-passive native wheel listener to container element to prevent whole-page zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onNativeWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleWheel(e);
      }
    };

    el.addEventListener("wheel", onNativeWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onNativeWheel);
    };
  }, [handleWheel]);

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
    handleWheel,
    containerRef,
    transformStyle: {
      transform: `scale(${zoomLevel}) translate3d(${panOffset.x}px, ${panOffset.y}px, 0)`,
      transformOrigin: "top center",
      transition: isDragging ? "none" : "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
    },
  };
}
