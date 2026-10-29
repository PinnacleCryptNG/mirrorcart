export type Slot = "upper" | "lower" | "full" | "shoes" | "bag" | "necklace" | "earring";

export type Variant = {
  id: string;
  label: string;
  swatch: string;
  image: string;
  /** Shop display image when `image` is a worn reference (e.g. skirts and trousers). */
  display?: string;
  /** Jewellery variants can change the try-on slot (pendant → necklace, hoops → earring). */
  slot?: Slot;
};

export type Product = {
  id: string;
  name: string;
  category: "Tops" | "Bottoms" | "Full looks" | "Shoes" | "Bags" | "Jewellery";
  slot: Slot;
  price: number;
  blurb: string;
  fabric: string;
  /** Worn reference photo (lower body refs must be worn outfits per the YouCam clothes docs). */
  worn?: boolean;
  fabricSwappable?: boolean;
  variants: Variant[];
};

const img = (id: string, v: string) => `/products/${id}-${v}.jpg`;

export const PRODUCTS: Product[] = [
  {
    id: "linen-shirt", name: "Linen Shirt", category: "Tops", slot: "upper", price: 68,
    blurb: "Relaxed, breathable button-up in washed linen.", fabric: "100% linen", fabricSwappable: true,
    variants: [
      { id: "white", label: "White", swatch: "#f4f4f2", image: img("linen-shirt", "white") },
      { id: "sky", label: "Sky", swatch: "#b8d3ee", image: img("linen-shirt", "sky") },
      { id: "sand", label: "Sand", swatch: "#d9cbb3", image: img("linen-shirt", "sand") },
    ],
  },
  {
    id: "ribbed-knit-top", name: "Ribbed Knit Top", category: "Tops", slot: "upper", price: 42,
    blurb: "Close-fitting rib knit with a clean crew neck.", fabric: "Cotton-modal rib", fabricSwappable: true,
    variants: [
      { id: "black", label: "Black", swatch: "#151515", image: img("ribbed-knit-top", "black") },
      { id: "oat", label: "Oat", swatch: "#e3dccd", image: img("ribbed-knit-top", "oat") },
      { id: "rust", label: "Rust", swatch: "#c4542a", image: img("ribbed-knit-top", "rust") },
    ],
  },
  {
    id: "denim-jacket", name: "Denim Jacket", category: "Tops", slot: "upper", price: 96,
    blurb: "The trucker jacket, cut slightly boxy.", fabric: "12 oz cotton denim",
    variants: [
      { id: "light", label: "Light wash", swatch: "#9dbbdc", image: img("denim-jacket", "light") },
      { id: "dark", label: "Dark rinse", swatch: "#26355a", image: img("denim-jacket", "dark") },
    ],
  },
  {
    id: "wide-leg-trousers", name: "Wide-leg Trousers", category: "Bottoms", slot: "lower", price: 84, worn: true,
    blurb: "High-waisted and fluid, pressed with a front crease.", fabric: "Recycled poly-viscose twill", fabricSwappable: true,
    variants: [
      { id: "black", label: "Black", swatch: "#1a1a1a", image: img("wide-leg-trousers", "black"), display: img("wide-leg-trousers", "black-flat") },
      { id: "camel", label: "Camel", swatch: "#b08a5b", image: img("wide-leg-trousers", "camel"), display: img("wide-leg-trousers", "camel-flat") },
    ],
  },
  {
    id: "pleated-midi-skirt", name: "Pleated Midi Skirt", category: "Bottoms", slot: "lower", price: 74, worn: true,
    blurb: "Knife pleats that move when you do.", fabric: "Satin-finish crepe", fabricSwappable: true,
    variants: [
      { id: "sage", label: "Sage", swatch: "#93ab92", image: img("pleated-midi-skirt", "sage"), display: img("pleated-midi-skirt", "sage-flat") },
      { id: "navy", label: "Navy", swatch: "#1f2a4a", image: img("pleated-midi-skirt", "navy"), display: img("pleated-midi-skirt", "navy-flat") },
    ],
  },
  {
    id: "wrap-dress", name: "Wrap Dress", category: "Full looks", slot: "full", price: 112,
    blurb: "Midi wrap with a tie waist and soft short sleeves.", fabric: "Viscose crepe", fabricSwappable: true,
    variants: [
      { id: "sage", label: "Sage", swatch: "#8fae88", image: img("wrap-dress", "sage") },
      { id: "terracotta", label: "Terracotta", swatch: "#c9603f", image: img("wrap-dress", "terracotta") },
    ],
  },
  {
    id: "jumpsuit", name: "Utility Jumpsuit", category: "Full looks", slot: "full", price: 128,
    blurb: "Sleeveless, belted, with wide full-length legs.", fabric: "Cotton twill",
    variants: [
      { id: "olive", label: "Olive", swatch: "#5f6b3a", image: img("jumpsuit", "olive") },
      { id: "black", label: "Black", swatch: "#161616", image: img("jumpsuit", "black") },
    ],
  },
  {
    id: "white-sneakers", name: "White Sneakers", category: "Shoes", slot: "shoes", price: 90,
    blurb: "Minimal leather low-tops for everything.", fabric: "Full-grain leather",
    variants: [
      { id: "white", label: "All white", swatch: "#f7f7f7", image: img("white-sneakers", "white") },
      { id: "gum", label: "Gum sole", swatch: "#c8925a", image: img("white-sneakers", "gum") },
    ],
  },
  {
    id: "block-heel-loafers", name: "Block-heel Loafers", category: "Shoes", slot: "shoes", price: 118,
    blurb: "Penny loafers lifted on a 4 cm block heel.", fabric: "Polished leather",
    variants: [
      { id: "black", label: "Black", swatch: "#111111", image: img("block-heel-loafers", "black") },
      { id: "tan", label: "Tan", swatch: "#a8673a", image: img("block-heel-loafers", "tan") },
    ],
  },
  {
    id: "leather-tote", name: "Leather Tote", category: "Bags", slot: "bag", price: 165,
    blurb: "A structured everyday tote that fits a laptop.", fabric: "Vegetable-tanned leather",
    variants: [
      { id: "cognac", label: "Cognac", swatch: "#a35a2a", image: img("leather-tote", "cognac") },
      { id: "black", label: "Black", swatch: "#121212", image: img("leather-tote", "black") },
    ],
  },
  {
    id: "mini-crossbody", name: "Mini Crossbody", category: "Bags", slot: "bag", price: 98,
    blurb: "Phone, cards, keys. Adjustable strap.", fabric: "Smooth leather",
    variants: [
      { id: "cream", label: "Cream", swatch: "#eee6d6", image: img("mini-crossbody", "cream") },
      { id: "burgundy", label: "Burgundy", swatch: "#6c1f2a", image: img("mini-crossbody", "burgundy") },
    ],
  },
  {
    id: "gold-pendant", name: "Gold Pendant Necklace", category: "Jewellery", slot: "necklace", price: 58,
    blurb: "A fine chain with a hammered disc. Also as hoops.", fabric: "18k gold-plated brass",
    variants: [
      { id: "pendant", label: "Pendant necklace", swatch: "#d4a945", image: img("gold-pendant", "pendant"), slot: "necklace" },
      { id: "hoops", label: "Hoop earrings", swatch: "#e0b85a", image: img("gold-pendant", "hoops"), slot: "earring" },
    ],
  },
];

export const CATEGORIES = ["Tops", "Bottoms", "Full looks", "Shoes", "Bags", "Jewellery"] as const;

export function getProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getVariant(productId: string, variantId?: string): { product: Product; variant: Variant } | undefined {
  const product = getProduct(productId);
  if (!product) return undefined;
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  return { product, variant };
}

export function slotOf(product: Product, variant: Variant): Slot {
  return variant.slot ?? product.slot;
}

export const SLOT_LABEL: Record<Slot, string> = {
  upper: "Top",
  lower: "Bottom",
  full: "Dress / full look",
  shoes: "Shoes",
  bag: "Bag",
  necklace: "Necklace",
  earring: "Earrings",
};

export const money = (n: number) => `$${n.toFixed(0)}`;
