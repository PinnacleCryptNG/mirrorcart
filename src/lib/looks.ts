export type LookSlot = "full" | "upper" | "lower" | "shoes" | "bag" | "necklace";
export type LookPiece = { src: string; name: string; detail: string; price: number; slot: LookSlot };
export type Look = { name: string; pieces: LookPiece[] };

/** Where each piece lands in a mirror flat-lay (glass is 100 × 150): x, y, w, h, tilt. */
export const LOOK_SLOT: Record<LookSlot, [number, number, number, number, number]> = {
  full: [12, 13, 52, 118, -4],
  upper: [12, 10, 48, 54, -4],
  lower: [16, 56, 42, 80, 2],
  necklace: [61, 13, 28, 40, 5],
  bag: [58, 56, 32, 46, 8],
  shoes: [50, 110, 42, 26, -7],
};

const P = (f: string, name: string, detail: string, price: number, slot: LookSlot): LookPiece =>
  ({ src: `/hero/cut/${f}.png`, name, detail, price, slot });

export const lookTotal = (l: Look) => l.pieces.reduce((s, p) => s + p.price, 0);

export const LOOKS: Look[] = [
  { name: "Look 01 · Dinner", pieces: [
    P("wrap-dress-terracotta", "Wrap dress", "Terracotta · $112", 112, "full"),
    P("block-heel-loafers-tan", "Loafers", "Tan · $118", 118, "shoes"),
    P("mini-crossbody-burgundy", "Mini crossbody", "Burgundy · $98", 98, "bag"),
    P("gold-pendant-pendant", "Gold pendant", "Gold · $58", 58, "necklace"),
  ] },
  { name: "Look 02 · Gallery", pieces: [
    P("jumpsuit-black", "Jumpsuit", "Black · $128", 128, "full"),
    P("block-heel-loafers-black", "Loafers", "Black · $118", 118, "shoes"),
    P("leather-tote-cognac", "Leather tote", "Cognac · $165", 165, "bag"),
    P("gold-pendant-hoops", "Gold hoops", "Gold · $58", 58, "necklace"),
  ] },
  { name: "Look 03 · Brunch", pieces: [
    P("wrap-dress-sage", "Wrap dress", "Sage · $112", 112, "full"),
    P("block-heel-loafers-tan", "Loafers", "Tan · $118", 118, "shoes"),
    P("mini-crossbody-cream", "Mini crossbody", "Cream · $98", 98, "bag"),
    P("gold-pendant-hoops", "Gold hoops", "Gold · $58", 58, "necklace"),
  ] },
];

export const LOOKBOOK: Look[] = [
  { name: "The office", pieces: [
    P("ribbed-knit-top-black", "Knit top", "Black · $42", 42, "upper"),
    P("wide-leg-trousers-camel", "Wide-leg trousers", "Camel · $84", 84, "lower"),
    P("block-heel-loafers-black", "Loafers", "Black · $118", 118, "shoes"),
    P("leather-tote-cognac", "Leather tote", "Cognac · $165", 165, "bag"),
  ] },
  { ...LOOKS[0], name: "The dinner" },
  { name: "The weekend", pieces: [
    P("linen-shirt-sand", "Linen shirt", "Sand · $68", 68, "upper"),
    P("pleated-midi-skirt-sage", "Pleated midi skirt", "Sage · $74", 74, "lower"),
    P("block-heel-loafers-tan", "Loafers", "Tan · $118", 118, "shoes"),
    P("mini-crossbody-cream", "Mini crossbody", "Cream · $98", 98, "bag"),
    P("gold-pendant-hoops", "Gold hoops", "Gold · $58", 58, "necklace"),
  ] },
];
