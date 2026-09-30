import type { BoatImage } from "@/lib/wix-image";
import type { ReelVariant } from "@/components/HeroReel";

export { THALIA_PRODUCT_SLUG } from "@/lib/landings";

// Curated copy for the Thalia landing. It is hand-edited from the owners' listing in the
// Wix dashboard rather than parsed out of it: the listing is free-form HTML, and a landing
// page needs the facts split into stats, specs and a timeline that the HTML does not mark.
// If the listing changes (price above all), this file has to follow.

export const THALIA_PRICE_USD = 35000;
export const THALIA_LOCATION = "Riachuelo, Colonia del Sacramento, Uruguay";
export const THALIA_FLAG = "Argentina";

export const THALIA_WHATSAPP_URL =
  "https://wa.me/5491126949628?text=" +
  encodeURIComponent(
    "Hola! Me interesa el motovelero clásico Thalia (1931). ¿Podemos coordinar una visita?",
  );

// The owners' vertical reel (a 4K 9:16 phone edit), served from our static assets in two
// sizes. Named by height; `width` is what the player compares against the box it fills.
export const THALIA_REEL_VARIANTS: ReelVariant[] = [
  { src: "/site/thalia/reel-1280.mp4", width: 720 },
  { src: "/site/thalia/reel-1920.mp4", width: 1080 },
];
export const THALIA_REEL_POSTER = "/site/thalia/reel-poster.jpg";

const wix = (id: string, width: number, height: number, alt: string): BoatImage => ({
  url: `https://static.wixstatic.com/media/${id}`,
  alt,
  width,
  height,
});

export const PHOTOS = {
  aerial: wix(
    "fac5f8_c1988720bc7d4bd6bf26766034388800~mv2.jpg",
    1360,
    765,
    "Vista aérea de Thalia fondeado frente a la costa",
  ),
  aerialTender: wix(
    "fac5f8_6f67775445be49b38b50bee010865570~mv2.jpg",
    1600,
    900,
    "Thalia con su bote auxiliar, vista aérea",
  ),
  calm: wix(
    "fac5f8_c8a73e99e4624e6a93adfb89c150f3ad~mv2.jpg",
    747,
    1600,
    "Thalia fondeado en aguas calmas bajo un cielo azul",
  ),
  hull: wix(
    "fac5f8_17dcfc2cdb1240d498d6476b2f012ac6~mv2.jpg",
    1600,
    747,
    "Casco de madera y quilla corrida de Thalia en varadero",
  ),
  helm: wix(
    "fac5f8_f3ba894f57b144fe94527c80252f3055~mv2.jpg",
    4000,
    1868,
    "Instrumental de navegación iluminado en la timonera",
  ),
  sunset: wix(
    "fac5f8_67724cfb0e12471888e7d536aadc85ed~mv2.jpg",
    1868,
    4000,
    "Thalia al atardecer, reflejado en el agua",
  ),
  sails: wix(
    "fac5f8_2f9a170e25a3476785a70e1fabbcabef~mv2.jpg",
    1868,
    4000,
    "Navegando a vela al atardecer",
  ),
  deck: wix(
    "fac5f8_6ea999c71c5c436db6e129eff06e342c~mv2.jpg",
    2252,
    4000,
    "Pasillo lateral con cubierta de teca",
  ),
  anchored: wix(
    "fac5f8_90e4d1fb22c04395bd4115d7c3737d90~mv2.jpg",
    1868,
    4000,
    "Thalia fondeado, con el toldo azul armado",
  ),
  poster: wix(
    "fac5f8_38935359773c43769bb060fb8fbe2fa3~mv2.png",
    1024,
    1536,
    "Pieza gráfica de Thalia con sus características principales",
  ),
} as const;

// The first photo is featured at double size in the grid; the rest alternate subjects.
export const GALLERY: BoatImage[] = [
  PHOTOS.aerial,
  PHOTOS.sunset,
  PHOTOS.helm,
  PHOTOS.calm,
  PHOTOS.deck,
  PHOTOS.aerialTender,
  PHOTOS.sails,
  PHOTOS.hull,
  PHOTOS.anchored,
];

export const KEY_STATS = [
  { value: "1931", label: "Año de construcción" },
  { value: "10,05 m", label: "Eslora" },
  { value: "2,85 m", label: "Manga" },
  { value: "1,30 m", label: "Calado" },
  { value: "43 HP", label: "Volvo Penta turbo diésel" },
  { value: "~6 nudos", label: "Media de navegación" },
];

export const HIGHLIGHTS = [
  {
    icon: "🪵",
    title: "Madera de 1931",
    body: "Construcción completa por Parodi sobre diseño de Campos, con quilla corrida. Casi un siglo de historia a flote.",
  },
  {
    icon: "🔧",
    title: "Refit integral",
    body: "Jarcia, velas, interior, motor y cubierta de teca renovados alrededor de 2020, con timón de rueda.",
  },
  {
    icon: "⛵",
    title: "Aparejo cutter",
    body: "Aparejo medido con mayor y génova Hood, enrollador, trinquetilla y spinnaker en buen estado.",
  },
  {
    icon: "🌊",
    title: "Navegando hoy",
    body: "No es una pieza de museo: sigue navegando y recibió mejoras hasta 2025.",
  },
];

export const SPECS: { label: string; value: string }[] = [
  { label: "Año", value: "1931" },
  { label: "Tipo", value: "Motovelero" },
  { label: "Bandera", value: THALIA_FLAG },
  { label: "Ubicación", value: THALIA_LOCATION },
  { label: "Material del casco", value: "Madera" },
  { label: "Constructor", value: "Parodi" },
  { label: "Diseño", value: "Campos" },
  { label: "Eslora", value: "10,05 m" },
  { label: "Manga", value: "2,85 m" },
  { label: "Puntal", value: "1,46 m" },
  { label: "Calado", value: "1,30 m" },
  { label: "Tonelaje bruto / neto", value: "8 / 6" },
  { label: "Quilla", value: "Corrida" },
  { label: "Aparejo", value: "Cutter — aparejo medido" },
  { label: "Motor", value: "Volvo Penta 43 HP turbo diésel" },
  { label: "Matrícula", value: "06902 REY" },
];

// The three areas with a photo of their own get a full feature row; the rest go in cards.
export const FEATURE_ROWS = [
  {
    eyebrow: "Velamen y aparejo",
    title: "Un cutter listo para navegar",
    image: PHOTOS.sails,
    body: "Aparejo cutter medido, con la jarcia renovada alrededor de 2020 y un juego de velas completo.",
    items: [
      "Mayor Hood y génova Hood",
      "Enrollador de proa",
      "Trinquetilla",
      "Spinnaker en buen estado y tangón",
      "Cubre mayor",
      "Cabullería completa",
    ],
  },
  {
    eyebrow: "Cubierta y cockpit",
    title: "Teca, rueda y Sunbrella",
    image: PHOTOS.deck,
    body: "La cubierta de teca se rehízo por completo en el refit, y el timón pasó de caña a rueda.",
    items: [
      "Cubierta completa de teca",
      "Timón de rueda",
      "Cerramiento de cockpit completo en Sunbrella",
      "Carpa completa de Sunbrella",
      "Pescantes en popa",
      "Bomba de achique automática",
    ],
  },
  {
    eyebrow: "Navegación y electrónica",
    title: "Instrumental para salir tranquilo",
    image: PHOTOS.helm,
    body: "Piloto automático para las travesías largas y energía propia gracias a los paneles solares.",
    items: [
      "Piloto automático Raymarine ST4000",
      "Ecosonda North Star",
      "VHF Uniden",
      "2 paneles solares",
    ],
  },
];

export const EQUIPMENT = [
  {
    icon: "⚙️",
    title: "Motor",
    items: [
      "Volvo Penta 43 HP turbo diésel",
      "Interno, con circuito cerrado de refrigeración",
      "Incorporado en el refit de ~2020",
      "Tanque de combustible de 80 l en acero inoxidable",
    ],
  },
  {
    icon: "🛏️",
    title: "Interior y confort",
    items: [
      "Cocina cardánica con horno",
      "Heladera 220 V",
      "Termotanque eléctrico",
      "Tanque de agua de 100 l",
      "Baño compartimentado con ducha",
      "Inodoro eléctrico nuevo (2025)",
      "Camarote y espacios de guardado",
    ],
  },
  {
    icon: "⚓",
    title: "Fondeo",
    items: [
      "Ancla Bruce galvanizada de 15 kg",
      "Ancla Danforth",
      "Cadena y cabo",
      "Elementos de fondeo",
    ],
  },
  {
    icon: "🛟",
    title: "Seguridad",
    items: ["Salvavidas reglamentarios", "Rosca salvavidas", "Elementos de seguridad a bordo"],
  },
];

export const TIMELINE = [
  {
    year: "1931",
    title: "Nace Thalia",
    body: "Construido íntegramente en madera por Parodi, sobre diseño de Campos, con quilla corrida y aparejo cutter.",
  },
  {
    year: "~2020",
    title: "Refit integral",
    body: "Renovación de jarcia y velas, reforma del interior, nuevo motor, timonera modificada, paso de caña a timón de rueda y cubierta de teca completa.",
  },
  {
    year: "2021",
    title: "Casa flotante",
    body: "Llegan sus actuales dueños, que lo convierten en su casa y lo navegan durante años. Suman paneles solares, pescantes y cerramiento del cockpit.",
  },
  {
    year: "2023",
    title: "Pintura",
    body: "Trabajos de pintura y mantenimiento general.",
  },
  {
    year: "2025",
    title: "Inodoro eléctrico nuevo",
    body: "Se reemplaza el inodoro por uno eléctrico nuevo.",
  },
  {
    year: "Hoy",
    title: "Navegando",
    body: "Listo para seguir sumando millas con quien continúe su historia.",
  },
];
