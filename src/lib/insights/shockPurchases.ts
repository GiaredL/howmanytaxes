/**
 * Ballpark unit costs for “sticker shock” scale — not DoD contract quotes.
 * Sources are commonly cited public figures; labeled as rough in the UI.
 */

export type ShockPurchase = {
  id: string;
  /** Used when quantity ≥ 1. */
  labelPlural: string;
  /** Used when quantity < 1 (“1/133 of a …”). */
  labelSingular: string;
  unitPrice: number;
  priceNote: string;
  /** Prefer including in the mix. */
  featured?: boolean;
};

export const SHOCK_PURCHASE_CATALOG: ShockPurchase[] = [
  {
    id: "nato-556",
    labelPlural: "rounds of 5.56mm ammo",
    labelSingular: "round of 5.56mm ammo",
    unitPrice: 0.5,
    priceNote: "~$0.50 / round",
    featured: true,
  },
  {
    id: "bmg-50",
    labelPlural: "rounds of .50 BMG",
    labelSingular: "round of .50 BMG",
    unitPrice: 3.5,
    priceNote: "~$3.50 / round",
  },
  {
    id: "hellfire",
    labelPlural: "Hellfire missiles",
    labelSingular: "Hellfire missile",
    unitPrice: 150_000,
    priceNote: "~$150k each",
    featured: true,
  },
  {
    id: "javelin",
    labelPlural: "Javelin missiles",
    labelSingular: "Javelin missile",
    unitPrice: 200_000,
    priceNote: "~$200k each",
    featured: true,
  },
  {
    id: "gmlrs",
    labelPlural: "GMLRS rockets (HIMARS-type)",
    labelSingular: "GMLRS rocket (HIMARS-type)",
    unitPrice: 170_000,
    priceNote: "~$170k each",
  },
  {
    id: "tomahawk",
    labelPlural: "Tomahawk cruise missiles",
    labelSingular: "Tomahawk cruise missile",
    unitPrice: 2_000_000,
    priceNote: "~$2M each",
    featured: true,
  },
  {
    id: "abrams",
    labelPlural: "M1 Abrams tanks",
    labelSingular: "M1 Abrams tank",
    unitPrice: 10_000_000,
    priceNote: "~$10M each",
  },
  {
    id: "reaper",
    labelPlural: "MQ-9 Reaper drones",
    labelSingular: "MQ-9 Reaper drone",
    unitPrice: 30_000_000,
    priceNote: "~$30M each",
  },
  {
    id: "f35",
    labelPlural: "F-35A fighters",
    labelSingular: "F-35A fighter",
    unitPrice: 80_000_000,
    priceNote: "~$80M each",
    featured: true,
  },
];

export type PickedShockPurchase = {
  id: string;
  label: string;
  unitPrice: number;
  priceNote: string;
  quantity: number;
  /** Display string for the big number (e.g. "1/133" or "28,000"). */
  quantityLabel: string;
};

function hashSeed(a: number, b: number): number {
  let h = (Math.floor(a) * 2654435761) ^ (Math.floor(b) * 2246822519);
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

/** Format taxPaid / unitPrice for sticker-shock comparisons. */
export function formatShockQuantity(quantity: number): {
  quantityLabel: string;
  useSingular: boolean;
} {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { quantityLabel: "—", useSingular: true };
  }
  if (quantity >= 100) {
    return {
      quantityLabel: Math.round(quantity).toLocaleString("en-US"),
      useSingular: false,
    };
  }
  if (quantity >= 1) {
    const s = quantity.toFixed(1).replace(/\.0$/, "");
    return { quantityLabel: s, useSingular: quantity < 1.05 };
  }
  // Fraction of one expensive unit — the “how little” punchline.
  const denom = Math.max(2, Math.round(1 / quantity));
  return {
    quantityLabel: `1/${denom.toLocaleString("en-US")}`,
    useSingular: true,
  };
}

/**
 * Pick a few defense / weapons sticker-shock comparisons.
 * Allows tiny fractions (your whole tax bill ≪ one missile).
 */
export function pickShockPurchases(
  taxPaid: number,
  householdIncome: number,
  count = 4,
): PickedShockPurchase[] {
  if (!Number.isFinite(taxPaid) || taxPaid <= 0) return [];

  const rng = mulberry32(hashSeed(taxPaid, householdIncome + 91));
  const candidates = SHOCK_PURCHASE_CATALOG.map((item) => ({
    item,
    quantity: taxPaid / item.unitPrice,
  })).filter((c) => c.quantity > 0 && c.quantity < 5_000_000);

  if (!candidates.length) return [];

  const picked: PickedShockPurchase[] = [];
  const used = new Set<string>();

  const take = (pool: typeof candidates) => {
    const open = pool.filter((c) => !used.has(c.item.id));
    if (!open.length) return;
    const choice = open[Math.floor(rng() * open.length)]!;
    used.add(choice.item.id);
    const { quantityLabel, useSingular } = formatShockQuantity(choice.quantity);
    picked.push({
      id: choice.item.id,
      label: useSingular
        ? `of a ${choice.item.labelSingular}`
        : choice.item.labelPlural,
      unitPrice: choice.item.unitPrice,
      priceNote: choice.item.priceNote,
      quantity: choice.quantity,
      quantityLabel,
    });
  };

  // Prefer: 1 cheap ammo (big count) + expensive missiles/aircraft (tiny fractions).
  const ammo = candidates.filter((c) => c.quantity >= 100);
  const expensive = candidates.filter((c) => c.quantity < 1);
  const mid = candidates.filter((c) => c.quantity >= 1 && c.quantity < 100);
  const featuredExpensive = expensive.filter((c) => c.item.featured);

  take(ammo);
  take(featuredExpensive.length ? featuredExpensive : expensive);
  take(featuredExpensive.length ? featuredExpensive : expensive);
  if (picked.length < count) take(mid.length ? mid : expensive);
  while (picked.length < count && used.size < candidates.length) {
    take(candidates);
  }

  // Ammo / big counts first, then tiny fractions.
  picked.sort((a, b) => b.quantity - a.quantity);
  return picked;
}
