/** SPSA COBIL — Lentille Boréale : instrument temporel à deux poignées, tactile et accessible. */
import { useEffect, useMemo, useRef, useState } from "react";
import { formatDate } from "@/lib/business";

type DoubleRangeSliderProps = { min: string; max: string; ticks: string[]; from: string; to: string; compact?: boolean; onChange: (from: string, to: string) => void };
const day = (value: string) => new Date(`${value}T12:00:00`).getTime() / 86400000;
const toPercent = (value: string, min: string, max: string) => Math.max(0, Math.min(100, ((day(value) - day(min)) / Math.max(1, day(max) - day(min))) * 100));

export function DoubleRangeSlider({ min, max, ticks, from, to, compact = false, onChange }: DoubleRangeSliderProps) {
  const track = useRef<HTMLDivElement>(null);
  const [visual, setVisual] = useState({ from: toPercent(from || min, min, max), to: toPercent(to || max, min, max) });
  const validTicks = useMemo(() => Array.from(new Set([min, ...ticks, max])).sort(), [min, max, ticks]);
  useEffect(() => setVisual({ from: toPercent(from || min, min, max), to: toPercent(to || max, min, max) }), [from, to, min, max]);

  const snap = (percentage: number) => {
    const target = day(min) + (day(max) - day(min)) * percentage / 100;
    return validTicks.reduce((best, candidate) => Math.abs(day(candidate) - target) < Math.abs(day(best) - target) ? candidate : best, validTicks[0]);
  };
  const update = (handle: "from" | "to", clientX: number) => {
    const bounds = track.current?.getBoundingClientRect(); if (!bounds) return;
    const pct = Math.max(0, Math.min(100, ((clientX - bounds.left) / bounds.width) * 100));
    const next = handle === "from" ? { from: Math.min(pct, visual.to - 0.01), to: visual.to } : { from: visual.from, to: Math.max(pct, visual.from + 0.01) };
    setVisual(next); onChange(snap(next.from), snap(next.to));
  };
  const pointer = (handle: "from" | "to", event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault(); event.stopPropagation();
    const move = (moveEvent: PointerEvent) => update(handle, moveEvent.clientX);
    const release = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", release); };
    window.addEventListener("pointermove", move); window.addEventListener("pointerup", release, { once: true });
  };
  const key = (handle: "from" | "to", event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return; event.preventDefault();
    const active = handle === "from" ? visual.from : visual.to;
    const next = event.key === "Home" ? 0 : event.key === "End" ? 100 : active + (event.key === "ArrowLeft" ? -1 : 1) * (event.shiftKey ? 8 : 1);
    const bounds = track.current?.getBoundingClientRect(); if (bounds) update(handle, bounds.left + bounds.width * Math.max(0, Math.min(100, next)) / 100);
  };
  return <div className={`range-instrument ${compact ? "range-instrument--compact" : ""}`} aria-label="Sélection de période">
    <div className="range-values"><span><b>{formatDate(from || min)}</b><small>début</small></span><i>→</i><span><b>{formatDate(to || max)}</b><small>fin</small></span></div>
    <div className="range-track" ref={track} onPointerDown={(event) => update(Math.abs(((event.clientX - (track.current?.getBoundingClientRect().left || 0)) / (track.current?.getBoundingClientRect().width || 1)) * 100 - visual.from) < Math.abs(((event.clientX - (track.current?.getBoundingClientRect().left || 0)) / (track.current?.getBoundingClientRect().width || 1)) * 100 - visual.to) ? "from" : "to", event.clientX)}>
      <span className="range-base" /><span className="range-fill" style={{ left: `${visual.from}%`, right: `${100 - visual.to}%` }} />
      {validTicks.slice(1, -1).map((tick) => <span className="range-tick" key={tick} style={{ left: `${toPercent(tick, min, max)}%` }} title={formatDate(tick)} />)}
      <button type="button" className="range-thumb" style={{ left: `${visual.from}%` }} aria-label="Date de début" onPointerDown={(event) => pointer("from", event)} onKeyDown={(event) => key("from", event)} />
      <button type="button" className="range-thumb" style={{ left: `${visual.to}%` }} aria-label="Date de fin" onPointerDown={(event) => pointer("to", event)} onKeyDown={(event) => key("to", event)} />
    </div>
    {!compact && <div className="range-endpoints"><span>{formatDate(min, false)}</span><span>{formatDate(max, false)}</span></div>}
  </div>;
}
