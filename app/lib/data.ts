export interface Product {
  id: number;
  codigo: string;
  nombre: string;
  precio: number;
  cantidad: number;
  activity: boolean;
}

export interface SaleItem {
  id: number;
  product_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  fecha: string;
  items: SaleItem[];
  total: number;
}

export interface DaySales {
  d: string;
  t: number;
}

export type RouteExtra = { filter?: string };

export interface Route {
  name: 'dashboard' | 'products' | 'sales' | 'sales-new' | 'sale-detail' | 'product-detail';
  param?: number | null;
  extra?: RouteExtra | null;
}


export function fmtMoney(n: number): string {
  return "$" + Math.round(n).toLocaleString("es-AR");
}

export function fmtMoneyShort(n: number): string {
  if (n >= 1_000_000) return "$" + (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return "$" + (n / 1_000).toFixed(1) + "K";
  return "$" + n;
}

export function stockStatus(qty: number): { label: string; cls: 'ok' | 'warn' | 'danger' } {
  if (qty === 0) return { label: "Sin stock", cls: "danger" };
  if (qty < 10) return { label: "Stock bajo", cls: "warn" };
  return { label: "Disponible", cls: "ok" };
}

export function productHasSales(productId: number, sales: Sale[]): boolean {
  return sales.some(s => s.items.some(it => it.product_id === productId));
}

export function nowFecha(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
}
