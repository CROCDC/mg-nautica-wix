"use client";

import { usePathname } from "next/navigation";
import AlertCta from "@/components/AlertCta";

// These pages carry their own alert CTA next to the boats; a second one in the footer
// would repeat it a scroll away.
const OWN_CTA = [/^\/$/, /^\/newsletter/, /^\/category\//, /^\/product-page\//];

export default function FooterAlerts() {
  const path = usePathname();
  return OWN_CTA.some((re) => re.test(path)) ? null : <AlertCta variant="band" />;
}
