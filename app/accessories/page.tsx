import type { Metadata } from "next";
import Link from "next/link";
import { getAccessories } from "@/lib/wix";
import BoatCard from "@/components/BoatCard";

// Always fetch the latest from Wix on every request (no caching).
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accesorios náuticos",
  description:
    "Accesorios náuticos en venta: motores, gomones, trailers, heladeras y más. Argentina y Uruguay.",
  alternates: { canonical: "/accessories" },
};

export default async function Accessories() {
  const items = await getAccessories();

  return (
    <div className="container">
      <div className="page-title">
        <h1>Accesorios náuticos</h1>
        <p>
          {items.length} accesorio{items.length === 1 ? "" : "s"} disponible
          {items.length === 1 ? "" : "s"}
        </p>
      </div>

      {items.length ? (
        <div className="boat-grid">
          {items.map((a) => (
            <BoatCard key={a.id} boat={a} />
          ))}
        </div>
      ) : (
        <div className="empty">
          <p>No hay accesorios disponibles por ahora.</p>
          <Link className="btn btn-outline" href="/category/all-products" style={{ marginTop: "1rem" }}>
            Ver embarcaciones
          </Link>
        </div>
      )}
    </div>
  );
}
