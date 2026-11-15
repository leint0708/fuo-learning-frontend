import { useState, useCallback, useRef, useEffect } from "react";

export interface UseZoomPanOptions {
  minZoom?: number;
  maxZoom?: number;
  zoomStep?: number;
  initialZoom?: number;
  maxPanOffset?: number;
  onZoomChange?: (zoom: number) => void;
  onPanChange?: (pan: { x: number; y: number }) => void;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getPinchDistance(a: { x: number; y: number }, b: { x: number; y: number }): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/**
 * Interactive zoom, zoom-normalized clamped pan, and two-finger pinch gesture hook.
 */
export function useZoomPan(options: UseZoomPanOptions = {}) {
  const {
    minZoom = 0.5,
    maxZoom = 3.0,
    zoomStep = 0.25,
    initialZoom = 1.0,
    maxPanOffset = 480,
    onZoomChange,
    onPanChange,
  } = options;

  const [zoomLevel, setZoomLevelState] = useState<number>(initialZoom);
  const [panOffset, setPanOffsetState] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isPinching, setIsPinching] = useState<boolean>(false);

  const zoomRef = useRef<number>(initialZoom);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const activePointerIdRef = useRef<number | null>(null);
  const touchPointsRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartRef = useRef<{ distance: number; zoom: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const setZoomLevel = useCallback(
    (scale: number) => {
      const clamped = clamp(Number(scale.toFixed(2)), minZoom, maxZoom);
      zoomRef.current = clamped;
      setZoomLevelState(clamped);
      onZoomChange?.(clamped);
    },
    [minZoom, maxZoom, onZoomChange]
  );

  const getPanLimit = useCallback(
    (axis: "x" | "y", currentZoom: number) => {
      const container = containerRef.current;
      if (container && container.clientWidth > 0 && container.clientHeight > 0) {
        const dimension = axis === "x" ? container.clientWidth : container.clientHeight;
        return Math.max(maxPanOffset * 0.5, dimension * Math.max(0.5, currentZoom * 0.65));
      }
      return maxPanOffset;
    },
    [maxPanOffset]
  );

  const setPanOffset = useCallback(
    (updater: { x: number; y: number } | ((prev: { x: number; y: number }) => { x: number; y: number })) => {
      setPanOffsetState((prev) => {
        const raw = typeof updater === "function" ? updater(prev) : updater;
        const limitX = getPanLimit("x", zoomRef.current);
        const limitY = getPanLimit("y", zoomRef.current);
        const clamped = {
          x: Math.round(clamp(raw.x, -limitX, limitX)),
          y: Math.round(clamp(raw.y, -limitY, limitY)),
        };
        onPanChange?.(clamped);
        return clamped;
      });
    },
    [getPanLimit, onPanChange]
  );

  const zoomIn = useCallback(() => {
    setZoomLevel(zoomRef.current + zoomStep);
  }, [zoomStep, setZoomLevel]);

  const zoomOut = useCallback(() => {
    setZoomLevel(zoomRef.current - zoomStep);
  }, [zoomStep, setZoomLevel]);

  const resetZoom = useCallback(() => {
    zoomRef.current = initialZoom;
    setZoomLevelState(initialZoom);
    setPanOffsetState({ x: 0, y: 0 });
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
          setZoomLevel(zoomRef.current + zoomStep);
        } else if (e.deltaY > 0) {
          setZoomLevel(zoomRef.current - zoomStep);
        }
      }
    },
    [zoomStep, setZoomLevel]
  );

  // Attach non-passive native wheel listener so Ctrl/Cmd+Wheel zooms canvas without scrolling browser zoom
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

  const applyNormalizedDelta = useCallback(
    (rawDx: number, rawDy: number) => {
      const scale = Math.max(0.5, zoomRef.current);
      setPanOffset((prev) => ({
        x: prev.x + rawDx / scale,
        y: prev.y + rawDy / scale,
      }));
    },
    [setPanOffset]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (activePointerIdRef.current !== null) return;
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      x: Number.isFinite(e.clientX) ? e.clientX : 0,
      y: Number.isFinite(e.clientY) ? e.clientY : 0,
    };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current || activePointerIdRef.current !== null) return;
      const clientX = Number.isFinite(e.clientX) ? e.clientX : dragStartRef.current.x;
      const clientY = Number.isFinite(e.clientY) ? e.clientY : dragStartRef.current.y;
      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;
      dragStartRef.current = { x: clientX, y: clientY };
      applyNormalizedDelta(dx, dy);
    },
    [applyNormalizedDelta]
  );

  const handleMouseUp = useCallback(() => {
    // Do not cancel pointer-captured gestures when fallback mouse handlers fire (e.g. mouseleave)
    if (activePointerIdRef.current !== null) return;
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const pointerId = typeof e.pointerId === "number" ? e.pointerId : 1;
    const clientX = Number.isFinite(e.clientX) ? e.clientX : 0;
    const clientY = Number.isFinite(e.clientY) ? e.clientY : 0;

    if (e.pointerType === "mouse" && e.button !== 0) {
      return;
    }

    if (e.pointerType === "touch") {
      touchPointsRef.current.set(pointerId, { x: clientX, y: clientY });
      if (touchPointsRef.current.size === 2) {
        const [firstTouch, secondTouch] = Array.from(touchPointsRef.current.values());
        if (firstTouch && secondTouch) {
          pinchStartRef.current = {
            distance: Math.max(1, getPinchDistance(firstTouch, secondTouch)),
            zoom: zoomRef.current,
          };
          setIsPinching(true);
          isDraggingRef.current = false;
          setIsDragging(false);
        }
        return;
      }
    }

    if (activePointerIdRef.current !== null && activePointerIdRef.current !== pointerId) {
      return;
    }

    activePointerIdRef.current = pointerId;
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = { x: clientX, y: clientY };

    if (typeof e.currentTarget.setPointerCapture === "function") {
      try {
        e.currentTarget.setPointerCapture(pointerId);
      } catch {
        // Synthetic DOM events in tests may lack an active pointer target
      }
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pointerId = typeof e.pointerId === "number" ? e.pointerId : 1;
      const clientX = Number.isFinite(e.clientX) ? e.clientX : dragStartRef.current.x;
      const clientY = Number.isFinite(e.clientY) ? e.clientY : dragStartRef.current.y;

      if (e.pointerType === "touch" && touchPointsRef.current.has(pointerId)) {
        touchPointsRef.current.set(pointerId, { x: clientX, y: clientY });
        if (touchPointsRef.current.size === 2 && pinchStartRef.current) {
          const [firstTouch, secondTouch] = Array.from(touchPointsRef.current.values());
          if (firstTouch && secondTouch) {
            const currentDist = getPinchDistance(firstTouch, secondTouch);
            const ratio = currentDist / pinchStartRef.current.distance;
            setZoomLevel(pinchStartRef.current.zoom * ratio);
          }
          return;
        }
      }

      if (!isDraggingRef.current) return;
      if (activePointerIdRef.current !== null && activePointerIdRef.current !== pointerId) {
        return;
      }

      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;
      dragStartRef.current = { x: clientX, y: clientY };
      applyNormalizedDelta(dx, dy);
    },
    [applyNormalizedDelta, setZoomLevel]
  );

  const clearPointer = useCallback((pointerId: number, currentTarget?: EventTarget & HTMLDivElement) => {
    touchPointsRef.current.delete(pointerId);
    if (touchPointsRef.current.size < 2) {
      pinchStartRef.current = null;
      setIsPinching(false);
    }

    if (activePointerIdRef.current !== null && activePointerIdRef.current !== pointerId) {
      return;
    }

    if (currentTarget && typeof currentTarget.releasePointerCapture === "function") {
      try {
        currentTarget.releasePointerCapture(pointerId);
      } catch {
        // Ignore if pointer capture already released
      }
    }

    activePointerIdRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const pointerId = typeof e.pointerId === "number" ? e.pointerId : 1;
      clearPointer(pointerId, e.currentTarget);
    },
    [clearPointer]
  );

  const handlePointerCancel = useCallback(
    (e?: React.PointerEvent<HTMLDivElement>) => {
      if (e) {
        clearPointer(typeof e.pointerId === "number" ? e.pointerId : 1, e.currentTarget);
        return;
      }
      touchPointsRef.current.clear();
      pinchStartRef.current = null;
      setIsPinching(false);
      activePointerIdRef.current = null;
      isDraggingRef.current = false;
      setIsDragging(false);
    },
    [clearPointer]
  );

  useEffect(() => {
    const onWindowBlur = () => {
      touchPointsRef.current.clear();
      pinchStartRef.current = null;
      setIsPinching(false);
      activePointerIdRef.current = null;
      isDraggingRef.current = false;
      setIsDragging(false);
    };
    window.addEventListener("blur", onWindowBlur);
    return () => window.removeEventListener("blur", onWindowBlur);
  }, []);

  return {
    zoomLevel,
    panOffset,
    isDragging,
    isPinching,
    isPanActive: zoomLevel > 1 || isPinching,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoomLevel,
    setPanOffset,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    handleWheel,
    containerRef,
    transformStyle: {
      transform: `scale(${zoomLevel}) translate3d(${panOffset.x}px, ${panOffset.y}px, 0)`,
      transformOrigin: "top center",
      transition: isDragging || isPinching ? "none" : "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
    },
  };
}
