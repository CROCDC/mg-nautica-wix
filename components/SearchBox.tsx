"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const row = { display: "flex", flexDirection: "column" as const, gap: ".3rem" };

// Client navigation so the grid's <Suspense> shows its loading skeleton.
export default function SearchBox({
  basePath,
  sort,
  q,
  min,
  max,
}: {
  basePath: string;
  sort: string;
  q: string;
  min: string;
  max: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(q);
  const [minV, setMinV] = useState(min);
  const [maxV, setMaxV] = useState(max);

  // Keep `sort` plus any non-empty filter; drop the rest so URLs stay clean.
  function push(next: { q: string; min: string; max: string }) {
    const p = new URLSearchParams();
    if (sort) p.set("sort", sort);
    if (next.q) p.set("q", next.q);
    if (next.min) p.set("min", next.min);
    if (next.max) p.set("max", next.max);
    const s = p.toString();
    router.push(`${basePath}${s ? `?${s}` : ""}`);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    push({ q: value.trim(), min: minV.trim(), max: maxV.trim() });
  }

  const hasFilters = value || minV || maxV;

  return (
    <form className="filter-group filter-search" onSubmit={submit} style={{ gap: ".9rem" }}>
      <div style={row}>
        <label htmlFor="q">Buscar</label>
        <div style={{ display: "flex", gap: ".5rem" }}>
          <input
            id="q"
            type="search"
            name="q"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Nombre del barco…"
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-sm btn-navy">
            Buscar
          </button>
          {hasFilters ? (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => {
                setValue("");
                setMinV("");
                setMaxV("");
                const p = new URLSearchParams();
                if (sort) p.set("sort", sort);
                const s = p.toString();
                router.push(`${basePath}${s ? `?${s}` : ""}`);
              }}
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      <div style={row}>
        <label htmlFor="min">Precio (US$)</label>
        <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
          <input
            id="min"
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            name="min"
            value={minV}
            onChange={(e) => setMinV(e.target.value)}
            placeholder="Mínimo"
            aria-label="Precio mínimo en dólares"
            style={{ flex: 1, minWidth: 0 }}
          />
          <span aria-hidden style={{ color: "var(--muted)" }}>—</span>
          <input
            id="max"
            type="number"
            inputMode="numeric"
            min={0}
            step={1000}
            name="max"
            value={maxV}
            onChange={(e) => setMaxV(e.target.value)}
            placeholder="Máximo"
            aria-label="Precio máximo en dólares"
            style={{ flex: 1, minWidth: 0 }}
          />
        </div>
      </div>
    </form>
  );
}
