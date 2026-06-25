import Link from "next/link";
import Image from "next/image";
import { type Boat, formatUsd } from "@/lib/wix";

export default function BoatCard({ boat }: { boat: Boat }) {
  return (
    <Link className="boat-card" href={`/product-page/${boat.slug}`}>
      <div className="boat-card-img">
        {boat.mainImage ? (
          <Image
            src={boat.mainImage.url}
            alt={boat.mainImage.alt}
            fill
            sizes="(max-width: 700px) 100vw, 380px"
            style={{ objectFit: "cover" }}
          />
        ) : null}
        {boat.onSale ? <span className="badge-sale">Oferta</span> : null}
      </div>
      <div className="boat-card-body">
        <div className="boat-card-title">{boat.name}</div>
        <div className="boat-card-meta">
          <div>
            {boat.onSale && boat.compareAtUsd ? (
              <div className="boat-card-price-old">{formatUsd(boat.compareAtUsd)}</div>
            ) : null}
            <div className="boat-card-price">{formatUsd(boat.priceUsd)}</div>
          </div>
        </div>
      </div>
    </Link>
  );
}
