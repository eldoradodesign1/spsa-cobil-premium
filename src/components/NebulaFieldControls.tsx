/** SPSA COBIL — Nebula : primitives de saisie sur mesure, sans widgets navigateur exposés. */
import { useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Minus, Plus, X } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMPTY_VALUE = "__nebula_empty__";

function toDate(value: string) {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function toIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function NebulaDatePicker({ value, onChange, placeholder = "Choisir une date", className = "", required = false }: { value: string; onChange: (value: string) => void; placeholder?: string; className?: string; required?: boolean }) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => toDate(value), [value]);
  const label = selected ? new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(selected) : placeholder;
  return <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><button type="button" className={`nebula-date-trigger ${value ? "has-value" : ""} ${className}`} aria-label={placeholder} aria-required={required}><CalendarDays size={15} /><span>{label}</span><ChevronDown size={14} /></button></PopoverTrigger><PopoverContent align="start" className="nebula-calendar-popover"><Calendar mode="single" selected={selected} onSelect={(date) => { if (date) { onChange(toIso(date)); setOpen(false); } }} /><div className="nebula-calendar-footer"><button type="button" onClick={() => onChange("")} disabled={!value}><X size={13} />Effacer</button><span>{required ? "Champ requis" : "Optionnel"}</span></div></PopoverContent></Popover>;
}

export function NebulaSelect({ value, onChange, options, placeholder = "Sélectionner", emptyLabel, className = "" }: { value: string; onChange: (value: string) => void; options: string[]; placeholder?: string; emptyLabel?: string; className?: string }) {
  const currentValue = value || EMPTY_VALUE;
  return <Select value={currentValue} onValueChange={(next) => onChange(next === EMPTY_VALUE ? "" : next)}><SelectTrigger className={`nebula-select-trigger ${className}`}><SelectValue placeholder={placeholder} /></SelectTrigger><SelectContent className="nebula-select-content">{emptyLabel && <SelectItem value={EMPTY_VALUE}>{emptyLabel}</SelectItem>}{options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent></Select>;
}

export function NebulaNumberInput({ value, onChange, placeholder, step = 1, min = 0, className = "" }: { value: string; onChange: (value: string) => void; placeholder?: string; step?: number; min?: number; className?: string }) {
  const adjust = (direction: -1 | 1) => {
    const parsed = Number(value.replace(",", "."));
    const base = Number.isFinite(parsed) ? parsed : min;
    onChange(String(Math.max(min, Math.round((base + direction * step) * 100) / 100)));
  };
  return <div className={`nebula-number ${className}`}><button type="button" onClick={() => adjust(-1)} aria-label="Diminuer"><Minus size={13} /></button><input type="text" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value.replace(/[^0-9,.-]/g, ""))} placeholder={placeholder} aria-label={placeholder} /><button type="button" onClick={() => adjust(1)} aria-label="Augmenter"><Plus size={13} /></button></div>;
}
