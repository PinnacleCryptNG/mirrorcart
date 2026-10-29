"use client";
import { useSyncExternalStore } from "react";

export type CartItem = { productId: string; variantId: string; fabricTemplateId?: string; qty: number };

const KEY = "aurel-cart-v1";
let cache: CartItem[] | null = null;
const listeners = new Set<() => void>();
const EMPTY: CartItem[] = [];

function read(): CartItem[] {
  if (typeof window === "undefined") return EMPTY;
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { cache = []; }
  return cache!;
}

function write(items: CartItem[]) {
  cache = items;
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}

export const cart = {
  get: read,
  add(productId: string, variantId: string) {
    const items = [...read()];
    const hit = items.find((i) => i.productId === productId && i.variantId === variantId);
    if (hit) hit.qty += 1; else items.push({ productId, variantId, qty: 1 });
    write(items.map((i) => ({ ...i })));
  },
  remove(productId: string, variantId?: string) {
    write(read().filter((i) => !(i.productId === productId && (!variantId || i.variantId === variantId))));
  },
  setVariant(productId: string, from: string, to: string) {
    write(read().map((i) => (i.productId === productId && i.variantId === from ? { ...i, variantId: to } : i)));
  },
  setFabric(productId: string, variantId: string, fabricTemplateId?: string) {
    write(read().map((i) => (i.productId === productId && i.variantId === variantId ? { ...i, fabricTemplateId } : i)));
  },
  replace(items: CartItem[]) { write(items); },
  clear() { write([]); },
};

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) { cache = null; cb(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(cb); window.removeEventListener("storage", onStorage); };
}

export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
