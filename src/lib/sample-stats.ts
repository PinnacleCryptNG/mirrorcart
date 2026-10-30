/** Illustrative numbers for a sample store, shown when a shop has no data yet. */
export const SAMPLE_STATS = {
  counts: { widget_open: 412, consent_given: 301, tryon_started: 288, tryon_completed: 251, item_swapped: 97, fabric_changed: 41, item_dropped_after_tryon: 63, checkout_after_tryon: 118, photo_deleted: 54 } as Record<string, number>,
  swapped: { "wrap-dress": 31, "linen-shirt": 22, "wide-leg-trousers": 18, "leather-tote": 12, "white-sneakers": 9 } as Record<string, number>,
  dropped: { "block-heel-loafers": 19, "pleated-midi-skirt": 14, "denim-jacket": 11 } as Record<string, number>,
  stats: { units_used: 1460, cached_hits: 388, units_saved: 776, live_steps: 730, demo_steps: 210 } as Record<string, number>,
  days: {} as Record<string, Record<string, number>>,
};

/** Dashboard defaults: assumed return rate (%) and cost per return ($). */
export const RETURN_RATE = 30, RETURN_COST = 15;
