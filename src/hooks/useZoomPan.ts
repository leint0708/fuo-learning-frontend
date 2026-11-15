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
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const activePointerIdRef = useRef<number | null>(null);
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
      setPanOffset((prev) => {
        const next = { x: prev.x + dx, y: prev.y + dy };
        onPanChange?.(next);
        return next;
      });
    },
    [onPanChange]
  );

  const handleMouseUp = useCallback(() => {
    activePointerIdRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const pointerId = typeof e.pointerId === "number" ? e.pointerId : 1;
    // Ignore secondary pointers if a drag is already active (multi-touch interruption protection)
    if (activePointerIdRef.current !== null && activePointerIdRef.current !== pointerId) {
      return;
    }
    if (e.pointerType === "mouse" && e.button !== 0) {
      return;
    }
    activePointerIdRef.current = pointerId;
    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = {
      x: Number.isFinite(e.clientX) ? e.clientX : 0,
      y: Number.isFinite(e.clientY) ? e.clientY : 0,
    };
    if (typeof e.currentTarget.setPointerCapture === "function") {
      try {
        e.currentTarget.setPointerCapture(pointerId);
      } catch {
        // Synthetic test events may not have an active pointerId in DOM
      }
    }
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      const pointerId = typeof e.pointerId === "number" ? e.pointerId : 1;
      if (activePointerIdRef.current !== null && activePointerIdRef.current !== pointerId) {
        return;
      }
      const clientX = Number.isFinite(e.clientX) ? e.clientX : dragStartRef.current.x;
      const clientY = Number.isFinite(e.clientY) ? e.clientY : dragStartRef.current.y;
      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;
      dragStartRef.current = { x: clientX, y: clientY };
      setPanOffset((prev) => {
        const next = { x: prev.x + dx, y: prev.y + dy };
        onPanChange?.(next);
        return next;
      });
    },
    [onPanChange]
  );

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const pointerId = typeof e.pointerId === "number" ? e.pointerId : 1;
    if (activePointerIdRef.current !== null && activePointerIdRef.current !== pointerId) {
      return;
    }
    if (typeof e.currentTarget.releasePointerCapture === "function") {
      try {
        e.currentTarget.releasePointerCapture(pointerId);
      } catch {
        // Ignore if pointer capture was already released
      }
    }
    activePointerIdRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  const handlePointerCancel = useCallback(() => {
    activePointerIdRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);
  }, []);

  // Clear dragging state if window loses focus mid-gesture
  useEffect(() => {
    const onWindowBlur = () => {
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
      transition: isDragging ? "none" : "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
    },
  };
}
