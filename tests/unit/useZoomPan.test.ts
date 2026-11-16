import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useZoomPan } from "@/hooks/useZoomPan";

describe("useZoomPan", () => {
  it("normalizes drag pan deltas by zoomLevel so panning does not accelerate at 3x zoom", () => {
    const { result } = renderHook(() =>
      useZoomPan({ initialZoom: 2.0, minZoom: 0.5, maxZoom: 3.0 })
    );

    const mockTarget = document.createElement("div");
    act(() => {
      result.current.handlePointerDown({
        pointerId: 1,
        pointerType: "mouse",
        button: 0,
        clientX: 100,
        clientY: 100,
        currentTarget: mockTarget,
      } as unknown as React.PointerEvent<HTMLDivElement>);
    });

    act(() => {
      result.current.handlePointerMove({
        pointerId: 1,
        clientX: 140,
        clientY: 120,
      } as unknown as React.PointerEvent<HTMLDivElement>);
    });

    // At 2.0x zoom, +40px screen drag moves logical pan by +20px (bounded)
    expect(result.current.panOffset.x).toBe(20);
    expect(result.current.panOffset.y).toBe(10);
  });

  it("clamps pan offset within bounded limits so diagram cannot be dragged off canvas", () => {
    const { result } = renderHook(() =>
      useZoomPan({ initialZoom: 1.0, maxPanOffset: 240 })
    );

    const mockTarget = document.createElement("div");
    act(() => {
      result.current.handlePointerDown({
        pointerId: 1,
        pointerType: "mouse",
        button: 0,
        clientX: 0,
        clientY: 0,
        currentTarget: mockTarget,
      } as unknown as React.PointerEvent<HTMLDivElement>);
    });

    act(() => {
      result.current.handlePointerMove({
        pointerId: 1,
        clientX: 5000,
        clientY: -5000,
      } as unknown as React.PointerEvent<HTMLDivElement>);
    });

    expect(result.current.panOffset.x).toBeLessThanOrEqual(240);
    expect(result.current.panOffset.y).toBeGreaterThanOrEqual(-240);
  });

  it("does not let handleMouseUp cancel an active pointer-captured drag when zoomed in", () => {
    const { result } = renderHook(() => useZoomPan({ initialZoom: 1.5 }));
    const mockTarget = document.createElement("div");

    act(() => {
      result.current.handlePointerDown({
        pointerId: 7,
        pointerType: "touch",
        button: 0,
        clientX: 10,
        clientY: 10,
        currentTarget: mockTarget,
      } as unknown as React.PointerEvent<HTMLDivElement>);
    });
    expect(result.current.isDragging).toBe(true);

    act(() => {
      result.current.handleMouseUp();
    });
    expect(result.current.isDragging).toBe(true);

    act(() => {
      result.current.handlePointerUp({
        pointerId: 7,
        currentTarget: mockTarget,
      } as unknown as React.PointerEvent<HTMLDivElement>);
    });
    expect(result.current.isDragging).toBe(false);
  });

  it("does not initiate single-finger touch drag at 1.0x zoom so vertical mobile scrolling stays free", () => {
    const { result } = renderHook(() => useZoomPan({ initialZoom: 1.0 }));
    const mockTarget = document.createElement("div");

    act(() => {
      result.current.handlePointerDown({
        pointerId: 8,
        pointerType: "touch",
        button: 0,
        clientX: 20,
        clientY: 20,
        currentTarget: mockTarget,
      } as unknown as React.PointerEvent<HTMLDivElement>);
    });
    expect(result.current.isDragging).toBe(false);
  });

  it("supports two-pointer pinch-to-zoom between 0.5x and 3.0x", () => {
    const onZoomChange = vi.fn();
    const { result } = renderHook(() =>
      useZoomPan({ initialZoom: 1.0, minZoom: 0.5, maxZoom: 3.0, onZoomChange })
    );
    const mockTarget = document.createElement("div");

    act(() => {
      result.current.handlePointerDown({
        pointerId: 1,
        pointerType: "touch",
        button: 0,
        clientX: 100,
        clientY: 100,
        currentTarget: mockTarget,
      } as unknown as React.PointerEvent<HTMLDivElement>);
      result.current.handlePointerDown({
        pointerId: 2,
        pointerType: "touch",
        button: 0,
        clientX: 200,
        clientY: 100,
        currentTarget: mockTarget,
      } as unknown as React.PointerEvent<HTMLDivElement>);
    });

    expect(result.current.isPanActive).toBe(true);

    // Spread fingers from 100px apart to 200px apart -> scale ~2.0x
    act(() => {
      result.current.handlePointerMove({
        pointerId: 2,
        pointerType: "touch",
        clientX: 300,
        clientY: 100,
      } as unknown as React.PointerEvent<HTMLDivElement>);
    });

    expect(result.current.zoomLevel).toBeGreaterThan(1.5);
    expect(result.current.zoomLevel).toBeLessThanOrEqual(3.0);
  });
});
