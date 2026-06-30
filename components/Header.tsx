import Link from "next/link";
import Image from "next/image";

// Catalog points at the Wix category URL (/category/<slug>); the rest are local routes.
const NAV = [
  { href: "/category/all-products", label: "Embarcaciones" },
  { href: "/accessories", label: "Accesorios" },
  { href: "/brazil-course", label: "Curso en Brasil" },
  { href: "/services", label: "Servicios" },
  { href: "/sell-your-boat", label: "Vendé tu embarcación" },
  { href: "/about-us", label: "Quiénes somos" },
  { href: "/contact", label: "Contacto" },
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
            width={70}
            height={40}
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
