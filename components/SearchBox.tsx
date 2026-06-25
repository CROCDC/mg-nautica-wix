"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Client navigation so the grid's <Suspense> shows its loading skeleton.
export default function SearchBox({
  basePath,
  sort,
  q,
}: {
  basePath: string;
  sort: string;
  q: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(q);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (sort) p.set("sort", sort);
    const v = value.trim();
    if (v) p.set("q", v);
    const s = p.toString();
    router.push(`${basePath}${s ? `?${s}` : ""}`);
  }

  return (
    <form className="filter-group filter-search" onSubmit={submit}>
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
        {value ? (
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => {
              setValue("");
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
    </form>
  );
}
