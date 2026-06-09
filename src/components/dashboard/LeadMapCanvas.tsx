"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";
import type { DashboardCityMapPin } from "@/actions/metrics";

type PlacedPin = DashboardCityMapPin & { x: number; y: number; size: number };

type MapTransform = { x: number; y: number; scale: number };

const MIN_SCALE = 0.5;
const MAX_SCALE = 3.5;
const ZOOM_FACTOR = 1.12;
const DRAG_THRESHOLD = 4;

function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function projectCityPins(pins: DashboardCityMapPin[]): PlacedPin[] {
  if (pins.length === 0) return [];

  const padding = 10;
  const lats = pins.map((p) => p.lat);
  const lngs = pins.map((p) => p.lng);
  let minLat = Math.min(...lats);
  let maxLat = Math.max(...lats);
  let minLng = Math.min(...lngs);
  let maxLng = Math.max(...lngs);

  const latSpan = Math.max(maxLat - minLat, 0.04);
  const lngSpan = Math.max(maxLng - minLng, 0.04);
  const latPad = latSpan * 0.2;
  const lngPad = lngSpan * 0.2;
  minLat -= latPad;
  maxLat += latPad;
  minLng -= lngPad;
  maxLng += lngPad;

  const maxCount = Math.max(...pins.map((p) => p.count), 1);
  const inner = 100 - padding * 2;

  const placed: PlacedPin[] = pins.map((p) => ({
    ...p,
    x: ((p.lng - minLng) / (maxLng - minLng)) * inner + padding,
    y: (1 - (p.lat - minLat) / (maxLat - minLat)) * inner + padding,
    size: Math.round(26 + (p.count / maxCount) * 18),
  }));

  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const a = placed[i];
      const b = placed[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = 11;
      if (dist > 0 && dist < minDist) {
        const push = (minDist - dist) / 2;
        const nx = dx / dist;
        const ny = dy / dist;
        a.x = Math.max(padding, Math.min(100 - padding, a.x - nx * push));
        a.y = Math.max(padding, Math.min(100 - padding, a.y - ny * push));
        b.x = Math.max(padding, Math.min(100 - padding, b.x + nx * push));
        b.y = Math.max(padding, Math.min(100 - padding, b.y + ny * push));
      }
    }
  }

  return placed;
}

function zoomAtPoint(
  transform: MapTransform,
  clientX: number,
  clientY: number,
  rect: DOMRect,
  scaleFactor: number
): MapTransform {
  const mx = clientX - rect.left;
  const my = clientY - rect.top;
  const newScale = clampScale(transform.scale * scaleFactor);
  const ratio = newScale / transform.scale;
  return {
    scale: newScale,
    x: mx - (mx - transform.x) * ratio,
    y: my - (my - transform.y) * ratio,
  };
}

export function LeadMapCanvas({ pins }: { pins: DashboardCityMapPin[] }) {
  const placed = useMemo(() => projectCityPins(pins), [pins]);
  const [active, setActive] = useState<string | null>(null);
  const [transform, setTransform] = useState<MapTransform>({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const suppressClickRef = useRef(false);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  const resetView = useCallback(() => {
    setTransform({ x: 0, y: 0, scale: 1 });
    setActive(null);
  }, []);

  const zoomBy = useCallback((factor: number) => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    setTransform((prev) => zoomAtPoint(prev, cx, cy, rect, factor));
  }, []);

  const handleWheel = useCallback((e: ReactWheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const el = viewportRef.current;
    if (!el) return;
    const factor = e.deltaY > 0 ? 1 / ZOOM_FACTOR : ZOOM_FACTOR;
    setTransform((prev) => zoomAtPoint(prev, e.clientX, e.clientY, el.getBoundingClientRect(), factor));
  }, []);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      suppressClickRef.current = false;
      viewportRef.current?.setPointerCapture(e.pointerId);
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        origX: transform.x,
        origY: transform.y,
        moved: false,
      };
    },
    [transform.x, transform.y]
  );

  const handlePointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;

    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
      drag.moved = true;
      suppressClickRef.current = true;
      setIsDragging(true);
      setActive(null);
    }
    if (drag.moved) {
      setTransform((prev) => ({
        ...prev,
        x: drag.origX + dx,
        y: drag.origY + dy,
      }));
    }
  }, []);

  const handlePointerUp = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    viewportRef.current?.releasePointerCapture(e.pointerId);
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  const handlePinClick = useCallback((city: string) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    setActive((prev) => (prev === city ? null : city));
  }, []);

  if (placed.length === 0) {
    return (
      <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Add leads with addresses to populate your map
      </p>
    );
  }

  const isDefaultView =
    transform.scale === 1 && transform.x === 0 && transform.y === 0;

  return (
    <div className="absolute inset-0">
      <div
        ref={viewportRef}
        className="absolute inset-0 touch-none select-none overflow-hidden"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-label="Lead map — drag to pan, scroll to zoom"
      >
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: "0 0",
          }}
        >
          <svg
            className="absolute inset-0 h-full w-full text-slate-200/80 dark:text-slate-700/50"
            aria-hidden
          >
            <defs>
              <pattern id="lead-map-grid" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#lead-map-grid)" />
          </svg>

          {placed.map((pin) => {
            const isActive = active === pin.city;
            return (
              <div
                key={pin.city}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
              >
                <button
                  type="button"
                  className="flex flex-col items-center gap-0.5 outline-none"
                  onClick={() => handlePinClick(pin.city)}
                  aria-label={`${pin.city}, ${pin.count} ${pin.count === 1 ? "lead" : "leads"}`}
                  aria-pressed={isActive}
                >
                  <span
                    className={
                      "flex items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white shadow-md transition-transform " +
                      (isActive
                        ? "scale-110 ring-2 ring-violet-300 ring-offset-2 ring-offset-transparent"
                        : "hover:scale-105")
                    }
                    style={{ width: pin.size, height: pin.size }}
                  >
                    {pin.count}
                  </span>
                  <span className="max-w-[5.5rem] truncate rounded-md bg-white/90 px-1.5 py-0.5 text-center text-[10px] font-medium text-slate-700 shadow-sm dark:bg-slate-900/90 dark:text-slate-300 sm:max-w-none sm:whitespace-nowrap">
                    {pin.city}
                  </span>
                </button>
                {isActive ? (
                  <div className="absolute left-1/2 top-full z-20 mt-1.5 w-max max-w-[10rem] -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-center shadow-lg dark:border-slate-600 dark:bg-slate-800">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{pin.city}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {pin.count} {pin.count === 1 ? "lead" : "leads"}
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute left-2 top-2 z-20 flex flex-col gap-1">
        <button
          type="button"
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-md border border-slate-200/90 bg-white/95 text-base font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900/95 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={() => zoomBy(ZOOM_FACTOR)}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-md border border-slate-200/90 bg-white/95 text-base font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900/95 dark:text-slate-200 dark:hover:bg-slate-800"
          onClick={() => zoomBy(1 / ZOOM_FACTOR)}
          aria-label="Zoom out"
        >
          −
        </button>
        {!isDefaultView ? (
          <button
            type="button"
            className="pointer-events-auto rounded-md border border-slate-200/90 bg-white/95 px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900/95 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={resetView}
          >
            Reset
          </button>
        ) : null}
      </div>
    </div>
  );
};
