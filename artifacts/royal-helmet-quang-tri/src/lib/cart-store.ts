import { useSyncExternalStore } from "react";
import type { Product } from "@workspace/api-client-react";

export type CartItem = { product: Product; quantity: number; size?: string; color?: string };

const STORAGE_KEY = "royal-helmet-cart";

function readInitial(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

let items: CartItem[] = readInitial();
const listeners = new Set<() => void>();

function emit() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return items;
}

function add(product: Product, quantity = 1, size?: string, color?: string) {
  const index = items.findIndex(
    (item) => item.product.id === product.id && item.size === size && item.color === color,
  );
  if (index < 0) {
    items = [...items, { product, quantity, size, color }];
  } else {
    items = items.map((item, i) =>
      i === index ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) } : item,
    );
  }
  emit();
}

function update(index: number, quantity: number) {
  items = items.map((item, i) =>
    i === index ? { ...item, quantity: Math.max(1, Math.min(quantity, item.product.stock)) } : item,
  );
  emit();
}

function remove(index: number) {
  items = items.filter((_, i) => i !== index);
  emit();
}

function clear() {
  items = [];
  emit();
}

export function useCart() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  return {
    items: snapshot,
    add,
    update,
    remove,
    clear,
    total: snapshot.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    count: snapshot.reduce((sum, item) => sum + item.quantity, 0),
  };
}
