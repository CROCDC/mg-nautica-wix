import Link from "next/link";

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="container">
        <h1>404</h1>
        <p>La página que buscás no existe o fue movida.</p>
        <div style={{ display: "flex", gap: ".75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link className="btn btn-primary btn-lg" href="/">
            Volver al inicio
          </Link>
          <Link className="btn btn-outline btn-lg" href="/category/all-products">
            Ver embarcaciones
          </Link>
        </div>
      </div>
    </div>
  );
}
