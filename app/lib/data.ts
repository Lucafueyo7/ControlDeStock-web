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

export function fmtFechaDisplay(fecha: string): string {
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return fecha;
  const day   = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year  = d.getFullYear();
  const h     = String(d.getHours()).padStart(2, '0');
  const m     = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${h}:${m}`;
}

export function nowFecha(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")} ${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
}

export type ChartPeriod = 'day' | 'month' | 'year';

export function computeChartData(sales: Sale[], period: ChartPeriod): DaySales[] {
  if (period === 'day') {
    const result: DaySales[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const t = sales.filter(s => s.fecha.slice(0, 10) === key).reduce((a, s) => a + s.total, 0);
      result.push({ d: `${key.slice(8)}/${key.slice(5, 7)}`, t });
    }
    return result;
  }
  if (period === 'month') {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const result: DaySales[] = [];
    for (let i = 11; i >= 0; i--) {
      let month = curMonth - i;
      let year = curYear;
      while (month < 0) { month += 12; year--; }
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const t = sales.filter(s => s.fecha.slice(0, 7) === key).reduce((a, s) => a + s.total, 0);
      const label = new Date(year, month).toLocaleDateString('es-AR', { month: 'short' });
      result.push({ d: label, t });
    }
    return result;
  }
  // year — last 4 years
  const curYear = new Date().getFullYear();
  return Array.from({ length: 4 }, (_, i) => {
    const year = String(curYear - 3 + i);
    const t = sales.filter(s => s.fecha.slice(0, 4) === year).reduce((a, s) => a + s.total, 0);
    return { d: year, t };
  });
}
