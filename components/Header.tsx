import Link from "next/link";
import Image from "next/image";

// Provisional routes — mirror the Wix URLs (/category/<slug>) and are finalized in Phase 3.
const NAV = [
  { href: "/category/all-products", label: "Embarcaciones" },
  { href: "/servicios", label: "Servicios" },
  { href: "/vender-tu-embarcacion", label: "Vendé tu embarcación" },
  { href: "/quienes-somos", label: "Quiénes somos" },
  { href: "/contacto", label: "Contacto" },
];

const WHATSAPP_URL = "https://wa.me/5491126949628";

export default function Header() {
  return (
    <header className="site-header" id="site-header">
      <nav className="nav">
        <Link href="/" className="brand">
          <Image
            src="/site/logo-mg-nautica.png"
            alt=""
            className="brand-logo"
            width={44}
            height={44}
          />
          MG <span>Náutica</span>
        </Link>
        <ul className="nav-links" id="nav-links">
          {NAV.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
        <div className="nav-actions">
          <a
            className="btn btn-primary btn-sm"
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener"
          >
            WhatsApp
          </a>
          <button className="nav-burger" id="nav-burger" aria-label="Menú">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </nav>
    </header>
  );
}
