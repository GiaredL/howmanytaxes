export type AltPurchase = {
  id: string;
  /** Plural / phrase label shown after the quantity. */
  label: string;
  /** Rough U.S. sticker / aid cost in dollars. */
  unitPrice: number;
  /** Short price caption, e.g. "~$350 each". */
  priceNote: string;
  vibe: "fun" | "impact" | "everyday";
  /** Prefer these in the mix when the quantity looks good. */
  featured?: boolean;
};

/**
 * Ballpark prices for scale — not quotes, donations, or charity math.
 * Impact items use rough public “cost of help” figures, not program grants.
 */
export const ALT_PURCHASE_CATALOG: AltPurchase[] = [
  // Impact
  {
    id: "hot-meals",
    label: "hot meals for people in need",
    unitPrice: 4,
    priceNote: "~$4 a plate",
    vibe: "impact",
    featured: true,
  },
  {
    id: "food-weeks",
    label: "people fed groceries for a week",
    unitPrice: 70,
    priceNote: "~$70 / person / week",
    vibe: "impact",
    featured: true,
  },
  {
    id: "housing-months",
    label: "months of housing for one person",
    unitPrice: 1_400,
    priceNote: "~$1,400 / month rent",
    vibe: "impact",
    featured: true,
  },
  {
    id: "housing-years",
    label: "years of housing for one person",
    unitPrice: 16_800,
    priceNote: "~$16.8k / year",
    vibe: "impact",
    featured: true,
  },

  // Fun gadgets
  {
    id: "switch",
    label: "Nintendo Switches",
    unitPrice: 350,
    priceNote: "~$350 each",
    vibe: "fun",
    featured: true,
  },
  {
    id: "iphone",
    label: "iPhones",
    unitPrice: 999,
    priceNote: "~$999 each",
    vibe: "fun",
    featured: true,
  },
  {
    id: "ps5",
    label: "PlayStation 5s",
    unitPrice: 500,
    priceNote: "~$500 each",
    vibe: "fun",
  },
  {
    id: "airpods",
    label: "pairs of AirPods",
    unitPrice: 180,
    priceNote: "~$180 each",
    vibe: "fun",
  },
  {
    id: "bike",
    label: "decent bikes",
    unitPrice: 650,
    priceNote: "~$650 each",
    vibe: "fun",
  },

  // Everyday / lifestyle
  {
    id: "coffee",
    label: "specialty coffees",
    unitPrice: 6,
    priceNote: "~$6 each",
    vibe: "everyday",
  },
  {
    id: "burrito",
    label: "fast-casual meals",
    unitPrice: 14,
    priceNote: "~$14 each",
    vibe: "everyday",
  },
  {
    id: "gas",
    label: "tanks of gas",
    unitPrice: 50,
    priceNote: "~$50 a tank",
    vibe: "everyday",
  },
  {
    id: "groceries",
    label: "weeks of household groceries",
    unitPrice: 200,
    priceNote: "~$200 / week",
    vibe: "everyday",
  },
  {
    id: "flight",
    label: "domestic round-trip flights",
    unitPrice: 380,
    priceNote: "~$380 each",
    vibe: "everyday",
  },
  {
    id: "laptop",
    label: "midrange laptops",
    unitPrice: 1_200,
    priceNote: "~$1,200 each",
    vibe: "everyday",
  },
  {
    id: "rent",
    label: "months of average U.S. rent",
    unitPrice: 1_750,
    priceNote: "~$1,750 / month",
    vibe: "everyday",
  },
  {
    id: "used-car",
    label: "used compact cars",
    unitPrice: 14_000,
    priceNote: "~$14k each",
    vibe: "everyday",
  },
  {
    id: "new-car",
    label: "new economy cars",
    unitPrice: 28_000,
    priceNote: "~$28k each",
    vibe: "everyday",
  },
];

export type PickedAltPurchase = {
  id: string;
  label: string;
  unitPrice: number;
  priceNote: string;
  vibe: AltPurchase["vibe"];
  quantity: number;
};

function hashSeed(a: number, b: number): number {
  let h = (Math.floor(a) * 2654435761) ^ (Math.floor(b) * 1597334677);
  h ^= h >>> 16;
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

type Candidate = { item: AltPurchase; quantity: number };

function takeRandom(
  candidates: Candidate[],
  used: Set<string>,
  rng: () => number,
  picked: PickedAltPurchase[],
) {
  const open = candidates.filter((c) => !used.has(c.item.id));
  if (!open.length) return;
  const choice = open[Math.floor(rng() * open.length)]!;
  used.add(choice.item.id);
  picked.push({
    id: choice.item.id,
    label: choice.item.label,
    unitPrice: choice.item.unitPrice,
    priceNote: choice.item.priceNote,
    vibe: choice.item.vibe,
    quantity: choice.quantity,
  });
}

/**
 * Pick playful “instead of taxes” items scaled to the tax bill.
 * Biases toward featured impact + gadget picks when quantities look good.
 */
export function pickAltPurchases(
  taxPaid: number,
  householdIncome: number,
  count = 5,
): PickedAltPurchase[] {
  if (!Number.isFinite(taxPaid) || taxPaid <= 0) return [];

  const viable: Candidate[] = ALT_PURCHASE_CATALOG.map((item) => ({
    item,
    quantity: taxPaid / item.unitPrice,
  })).filter(({ quantity }) => quantity >= 0.75 && quantity < 2_000_000);

  if (!viable.length) return [];

  const rng = mulberry32(hashSeed(taxPaid, householdIncome));
  const picked: PickedAltPurchase[] = [];
  const used = new Set<string>();

  const featuredImpact = viable.filter(
    (c) => c.item.featured && c.item.vibe === "impact",
  );
  const featuredFun = viable.filter(
    (c) => c.item.featured && c.item.vibe === "fun",
  );
  const otherFun = viable.filter(
    (c) => c.item.vibe === "fun" && !c.item.featured,
  );
  const everyday = viable.filter((c) => c.item.vibe === "everyday");

  // Aim for: 2 impact, 1–2 gadgets, rest everyday — then fill.
  takeRandom(featuredImpact, used, rng, picked);
  takeRandom(featuredImpact, used, rng, picked);
  takeRandom(featuredFun, used, rng, picked);
  if (picked.length < count) takeRandom([...featuredFun, ...otherFun], used, rng, picked);
  if (picked.length < count) takeRandom(everyday, used, rng, picked);

  while (picked.length < count && used.size < viable.length) {
    takeRandom(viable, used, rng, picked);
  }

  // Keep impact / fun near the top for the “funner” read.
  const rank = (vibe: AltPurchase["vibe"]) =>
    vibe === "impact" ? 0 : vibe === "fun" ? 1 : 2;
  picked.sort((a, b) => rank(a.vibe) - rank(b.vibe));

  return picked;
}

export function formatAltQuantity(quantity: number): string {
  if (quantity >= 100) return Math.round(quantity).toLocaleString("en-US");
  if (quantity >= 10) return quantity.toFixed(0);
  if (quantity >= 2) return quantity.toFixed(1).replace(/\.0$/, "");
  return quantity.toFixed(1);
}
