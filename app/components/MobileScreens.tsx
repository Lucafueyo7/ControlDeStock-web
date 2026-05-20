
'use client';
import React, { useState, useMemo, useEffect } from 'react';
import type { Product, Sale, Route, DaySales, ChartPeriod } from '../lib/data';
import { fmtMoney, fmtMoneyShort, stockStatus, productHasSales, computeChartData } from '../lib/data';
import { createProduct, updateProduct, deleteProduct } from '../actions/products';
import { createSale } from '../actions/sales';
import {
  SearchIcon, PlusIcon, BackIcon, AlertIcon, ArrowUpIcon, BoxIcon,
  CartIcon, InfoIcon, ArchiveIcon, TrashIcon, EditIcon,
  TrendIcon, ChevIcon, ReceiptIcon, XIcon,
} from './icons';
import { Badge, Sheet, useToast } from './ui';
import { NotaVentaModal } from './NotaVenta';
import { UserButton } from '@clerk/nextjs';

type GoTo = (name: Route['name'], param?: number | null, extra?: Route['extra']) => void;

// ── Dashboard ────────────────────────────────────────────────

export function MobileDashboard({ products, sales, onGoTo, dailySales: _ }: { products: Product[]; sales: Sale[]; onGoTo: GoTo; dailySales: DaySales[] }) {
  const [period, setPeriod] = useState<ChartPeriod>('day');
  const active = products.filter(p => p.activity);
  const totalRevenue = sales.reduce((s, x) => s + x.total, 0);
  const totalItems = sales.reduce((s, x) => s + x.items.reduce((a, i) => a + i.cantidad, 0), 0);
  const inventoryValue = active.reduce((s, p) => s + p.precio * p.cantidad, 0);
  const lowStock = active.filter(p => p.cantidad < 10).sort((a, b) => a.cantidad - b.cantidad).slice(0, 4);
  const recent = [...sales].sort((a, b) => b.id - a.id).slice(0, 4);
  const chartData = useMemo(() => computeChartData(sales, period), [sales, period]);
  const max = Math.max(...chartData.map(d => d.t), 1);

  return (
    <div className="scroll">
      <div className="header">
        <div>
          <h1 className="header-title">Resumen</h1>
          <div className="header-sub">18 may · actualizado hace 2 min</div>
        </div>
        <div className="header-actions">
          <button className="icon-btn">
            <UserButton />
          </button>
        </div>
      </div>

      <div className="metric-hero">
        <div className="metric-hero-label"><span className="dot" />Ingresos totales</div>
        <div className="metric-hero-value">{fmtMoney(totalRevenue)}</div>
        <div className="metric-hero-meta">
          <span className="delta"><ArrowUpIcon style={{ width: 11, height: 11 }} />+12.4%</span>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{sales.length} ventas · 14 días</span>
        </div>
      </div>

      <div className="metric-grid">
        <div className="metric-mini">
          <div className="metric-mini-label">SKUs activos</div>
          <div className="metric-mini-value">{active.length}</div>
          <div className="metric-mini-sub">{products.length - active.length} archivados</div>
        </div>
        <div className="metric-mini">
          <div className="metric-mini-label">Unid. vendidas</div>
          <div className="metric-mini-value">{totalItems}</div>
          <div className="metric-mini-sub">+8.1% vs. ant.</div>
        </div>
        <div className="metric-mini">
          <div className="metric-mini-label">Valor stock</div>
          <div className="metric-mini-value">{fmtMoneyShort(inventoryValue)}</div>
          <div className="metric-mini-sub">costo estimado</div>
        </div>
        <div className="metric-mini">
          <div className="metric-mini-label">Stock bajo</div>
          <div className="metric-mini-value" style={{ color: 'var(--warning)' }}>{active.filter(p => p.cantidad < 10).length}</div>
          <div className="metric-mini-sub">requieren reposición</div>
        </div>
      </div>

      <div className="bars-card">
        <div className="bars-head">
          <div className="bars-title">
            {period === 'day' ? 'Ventas por día' : period === 'month' ? 'Ventas por mes' : 'Ventas por año'}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['day', 'month', 'year'] as ChartPeriod[]).map(p => (
              <button key={p}
                style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 4, border: '1px solid var(--border)',
                  background: period === p ? 'var(--surface-hover)' : 'transparent',
                  color: period === p ? 'var(--text)' : 'var(--text-dim)',
                  fontWeight: period === p ? 600 : 400, cursor: 'pointer',
                }}
                onClick={() => setPeriod(p)}>
                {p === 'day' ? 'Día' : p === 'month' ? 'Mes' : 'Año'}
              </button>
            ))}
          </div>
        </div>
        <div className="bars">
          {chartData.map((d, i) => (
            <div key={i} className={`bar ${d.t === 0 ? 'muted' : ''}`}
              style={{ height: `${Math.max((d.t / max) * 100, 5)}%` }}
              title={`${d.d}: ${fmtMoney(d.t)}`} />
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">Stock bajo</div>
          <button className="section-action" onClick={() => onGoTo('products', null, { filter: 'low' })}>Ver todos →</button>
        </div>
        <div className="list">
          {lowStock.length === 0 ? (
            <div className="empty" style={{ padding: '32px 16px' }}><div className="empty-sub">Inventario en niveles saludables.</div></div>
          ) : lowStock.map(p => (
            <div key={p.id} className="list-row" onClick={() => onGoTo('product-detail', p.id)}>
              <div className="row-thumb">{p.codigo.slice(-4)}</div>
              <div className="row-main">
                <div className="row-title">{p.nombre}</div>
                <div className="row-meta"><span>{fmtMoney(p.precio)}</span></div>
              </div>
              <div className="row-side">
                <div className="row-side-main" style={{ color: p.cantidad === 0 ? 'var(--danger)' : 'var(--warning)' }}>{p.cantidad}</div>
                <div className="row-side-sub">unid.</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="section-title">Ventas recientes</div>
          <button className="section-action" onClick={() => onGoTo('sales')}>Ver todas →</button>
        </div>
        <div className="list">
          {recent.map(s => (
            <div key={s.id} className="list-row" onClick={() => onGoTo('sale-detail', s.id)}>
              <div className="row-thumb"><ReceiptIcon style={{ width: 16, height: 16, color: 'var(--text-muted)' }} /></div>
              <div className="row-main">
                <div className="row-title">Venta #{s.id}</div>
                <div className="row-meta">
                  <span>{s.fecha.split(' ')[1]}</span>
                  <span className="dot-sep">·</span>
                  <span>{s.items.reduce((a, i) => a + i.cantidad, 0)} ítems</span>
                </div>
              </div>
              <div className="row-side">
                <div className="row-side-main">{fmtMoney(s.total)}</div>
                <div className="row-side-sub">{s.items.length} prod.</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Products ─────────────────────────────────────────────────

export function MobileProducts({ products, setProducts, sales, onGoTo, initialFilter }: {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: Sale[];
  onGoTo: GoTo;
  initialFilter?: string;
}) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>(initialFilter as 'low' | 'out' || 'all');
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [actionsFor, setActionsFor] = useState<Product | null>(null);

  const visible = useMemo(() => {
    let l = products.filter(p => p.activity);
    if (query.trim()) {
      const q = query.toLowerCase();
      l = l.filter(p => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q) || String(p.id).includes(q));
    }
    if (filter === 'low') l = l.filter(p => p.cantidad > 0 && p.cantidad < 10);
    if (filter === 'out') l = l.filter(p => p.cantidad === 0);
    return l;
  }, [products, query, filter]);

  const handleDelete = async (product: Product) => {
    if (productHasSales(product.id, sales)) {
      setProducts(ps => ps.map(p => p.id === product.id ? { ...p, activity: false } : p));
      toast({ kind: 'info', title: `${product.nombre} archivado`, desc: 'Tiene ventas asociadas. Se marcó como inactivo y se oculta del catálogo.' });
    } else {
      setProducts(ps => ps.filter(p => p.id !== product.id));
      toast({ kind: 'success', title: `${product.nombre} eliminado`, desc: 'Sin ventas registradas. Se eliminó por completo.' });
    }
    setActionsFor(null);
    await deleteProduct(product.id);
  };

  const handleAdd = async (data: { codigo: string; nombre: string; precio: string; cantidad: string }) => {
    const nextId = (products.reduce((m, p) => Math.max(m, p.id), 0) || 0) + 1;
    const result = await createProduct({
      codigo: data.codigo || `ART-${String(nextId).padStart(4,'0')}`,
      nombre: data.nombre,
      precio: Number(data.precio) || 0,
      cantidad: Number(data.cantidad) || 0,
    });
    setProducts(ps => [...ps, result]);
    toast({ kind: 'success', title: 'Producto agregado', desc: `${data.nombre} se agregó al catálogo.` });
    setAddOpen(false);
  };

  const handleEdit = async (updated: Product) => {
    const result = await updateProduct(updated.id, { nombre: updated.nombre, precio: updated.precio, cantidad: updated.cantidad });
    setProducts(ps => ps.map(p => p.id === updated.id ? result : p));
    toast({ kind: 'success', title: 'Producto actualizado' });
    setEditing(null);
  };

  const nextId = (products.reduce((m, p) => Math.max(m, p.id), 0) || 0) + 1;

  return (
    <div className="scroll">
      <div className="header">
        <div>
          <h1 className="header-title">Productos</h1>
          <div className="header-sub">{visible.length} de {products.filter(p => p.activity).length} activos</div>
        </div>
        <div className="header-actions">
          <button className="icon-btn primary" onClick={() => setAddOpen(true)}>
            <PlusIcon style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </div>

      <div className="search-bar">
        <SearchIcon />
        <input placeholder="Buscar por nombre, código o ID…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      <div className="chips">
        <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todos</button>
        <button className={`chip warn ${filter === 'low' ? 'active' : ''}`} onClick={() => setFilter(filter === 'low' ? 'all' : 'low')}>
          <AlertIcon style={{ width: 11, height: 11 }} /> Stock bajo
        </button>
        <button className={`chip danger ${filter === 'out' ? 'active' : ''}`} onClick={() => setFilter(filter === 'out' ? 'all' : 'out')}>Sin stock</button>
      </div>

      <div className="section" style={{ paddingBottom: 8 }}>
        <div className="list">
          {visible.length === 0 ? (
            <div className="empty">
              <BoxIcon className="empty-icon" />
              <div className="empty-title">Sin resultados</div>
              <div className="empty-sub">Probá con otra búsqueda.</div>
            </div>
          ) : visible.map(p => {
            const pct = Math.min((p.cantidad / 50) * 100, 100);
            return (
              <div key={p.id} className="list-row" onClick={() => setActionsFor(p)}>
                <div className="row-thumb">{p.codigo.slice(-4)}</div>
                <div className="row-main">
                  <div className="row-title">{p.nombre}</div>
                  <div className="row-meta">
                    <span>{fmtMoney(p.precio)}</span>
                    <span className="dot-sep">·</span>
                    <span>
                      <span className="stock-bar">
                        <span className={`stock-bar-fill ${p.cantidad === 0 ? 'danger' : p.cantidad < 10 ? 'warn' : ''}`} style={{ width: `${pct}%` }} />
                      </span>
                      {p.cantidad} unid.
                    </span>
                  </div>
                </div>
                <ChevIcon className="chev" style={{ width: 16, height: 16 }} />
              </div>
            );
          })}
        </div>
      </div>

      <AddProductSheet open={addOpen} onClose={() => setAddOpen(false)} onSave={handleAdd} nextId={nextId} />
      <ProductActionsSheet product={actionsFor} onClose={() => setActionsFor(null)}
        onEdit={() => { setEditing(actionsFor); setActionsFor(null); }}
        onDelete={() => actionsFor && handleDelete(actionsFor)}
        onHistory={() => { actionsFor && onGoTo('product-detail', actionsFor.id); setActionsFor(null); }}
        sales={sales} />
      <EditProductSheet product={editing} onClose={() => setEditing(null)} onSave={handleEdit} />
    </div>
  );
}

function AddProductSheet({ open, onClose, onSave, nextId }: {
  open: boolean; onClose: () => void;
  onSave: (d: { codigo: string; nombre: string; precio: string; cantidad: string }) => void;
  nextId: number;
}) {
  const [data, setData] = useState({ codigo: '', nombre: '', precio: '', cantidad: '' });
  useEffect(() => {
    if (open) setData({ codigo: `ART-${String(nextId).padStart(4,'0')}`, nombre: '', precio: '', cantidad: '' });
  }, [open, nextId]);
  const canSave = data.nombre.trim() && data.precio !== '' && data.cantidad !== '';
  return (
    <Sheet open={open} onClose={onClose} title="Agregar producto" subtitle={`ID #${String(nextId).padStart(4,'0')} · se asignará al guardar`}
      footer={
        <>
          <button className="btn" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
          <button className="btn primary" style={{ flex: 2 }} disabled={!canSave} onClick={() => canSave && onSave(data)}>Guardar</button>
        </>
      }>
      <div className="row-fields">
        <div className="field">
          <label className="field-label">Código</label>
          <input className="input mono" value={data.codigo} onChange={e => setData(d => ({ ...d, codigo: e.target.value }))} />
        </div>
        <div className="field">
          <label className="field-label">ID</label>
          <input className="input mono" value={String(nextId).padStart(4,'0')} disabled style={{ opacity: 0.5 }} />
        </div>
      </div>
      <div className="field">
        <label className="field-label">Nombre</label>
        <input className="input" placeholder="ej. Auriculares Bluetooth K7" value={data.nombre} onChange={e => setData(d => ({ ...d, nombre: e.target.value }))} autoFocus />
      </div>
      <div className="row-fields">
        <div className="field">
          <label className="field-label">Precio (ARS)</label>
          <input className="input mono" type="number" inputMode="numeric" placeholder="0" value={data.precio} onChange={e => setData(d => ({ ...d, precio: e.target.value }))} />
        </div>
        <div className="field">
          <label className="field-label">Stock inicial</label>
          <input className="input mono" type="number" inputMode="numeric" placeholder="0" value={data.cantidad} onChange={e => setData(d => ({ ...d, cantidad: e.target.value }))} />
        </div>
      </div>
      <div className="info-pill">
        <InfoIcon style={{ width: 14, height: 14 }} />
        <div>El campo <code>activity</code> se inicializa en <b>true</b>. Si después de tener ventas es eliminado, se marcará como <b>false</b>.</div>
      </div>
    </Sheet>
  );
}

function EditProductSheet({ product, onClose, onSave }: { product: Product | null; onClose: () => void; onSave: (p: Product) => void }) {
  const [data, setData] = useState<Product | null>(null);
  useEffect(() => { if (product) setData({ ...product }); }, [product]);
  if (!product || !data) return null;
  return (
    <Sheet open={!!product} onClose={onClose} title="Editar producto" subtitle={`${product.codigo} · ID #${String(product.id).padStart(4,'0')}`}
      footer={
        <>
          <button className="btn" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
          <button className="btn primary" style={{ flex: 2 }} onClick={() => onSave(data)}>Guardar cambios</button>
        </>
      }>
      <div className="field">
        <label className="field-label">Nombre</label>
        <input className="input" value={data.nombre} onChange={e => setData(d => d ? { ...d, nombre: e.target.value } : d)} />
      </div>
      <div className="row-fields">
        <div className="field">
          <label className="field-label">Precio (ARS)</label>
          <input className="input mono" type="number" inputMode="numeric" value={data.precio} onChange={e => setData(d => d ? { ...d, precio: Number(e.target.value)||0 } : d)} />
        </div>
        <div className="field">
          <label className="field-label">Stock</label>
          <input className="input mono" type="number" inputMode="numeric" value={data.cantidad} onChange={e => setData(d => d ? { ...d, cantidad: Number(e.target.value)||0 } : d)} />
        </div>
      </div>
      <div className="field">
        <label className="field-label">Código</label>
        <input className="input mono" value={data.codigo} onChange={e => setData(d => d ? { ...d, codigo: e.target.value } : d)} />
      </div>
    </Sheet>
  );
}

function ProductActionsSheet({ product, onClose, onEdit, onDelete, onHistory, sales }: {
  product: Product | null; onClose: () => void; onEdit: () => void; onDelete: () => void; onHistory: () => void; sales: Sale[];
}) {
  if (!product) return null;
  const hasSales = productHasSales(product.id, sales);
  return (
    <Sheet open={!!product} onClose={onClose} title={product.nombre} subtitle={product.codigo}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button className="btn" onClick={onHistory}><TrendIcon style={{ width: 16, height: 16 }} /> Ver historial de ventas</button>
        <button className="btn" onClick={onEdit}><EditIcon style={{ width: 16, height: 16 }} /> Editar producto</button>
        <button className="btn" style={{ color: hasSales ? 'var(--warning)' : 'var(--danger)' }} onClick={onDelete}>
          {hasSales ? <><ArchiveIcon style={{ width: 16, height: 16 }} /> Archivar (tiene ventas)</> : <><TrashIcon style={{ width: 16, height: 16 }} /> Eliminar</>}
        </button>
      </div>
      <div className="info-pill" style={{ marginTop: 14 }}>
        <InfoIcon style={{ width: 14, height: 14 }} />
        <div>
          {hasSales
            ? <>Este producto tiene ventas. Al eliminarlo se marca <code>activity = false</code> y desaparece del catálogo, conservando el historial.</>
            : <>Este producto no tiene ventas. Se eliminará por completo del inventario.</>}
        </div>
      </div>
    </Sheet>
  );
}

// ── Sales ────────────────────────────────────────────────────

export function MobileSales({ sales, products, onGoTo }: { sales: Sale[]; products: Product[]; onGoTo: GoTo }) {
  const [query, setQuery] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const list = useMemo(() => {
    let l = [...sales].sort((a, b) => b.id - a.id);
    if (query.trim()) {
      const q = query.toLowerCase();
      l = l.filter(s => String(s.id).includes(q) || s.fecha.toLowerCase().includes(q));
    }
    if (filterFrom) l = l.filter(s => s.fecha.slice(0, 10) >= filterFrom);
    if (filterTo)   l = l.filter(s => s.fecha.slice(0, 10) <= filterTo);
    return l;
  }, [sales, query, filterFrom, filterTo]);

  const today = sales.filter(s => s.fecha.startsWith('2026-05-18')).reduce((a, s) => a + s.total, 0);

  const grouped = useMemo(() => {
    const g = new Map<string, Sale[]>();
    list.forEach(s => {
      const day = s.fecha.split(' ')[0];
      if (!g.has(day)) g.set(day, []);
      g.get(day)!.push(s);
    });
    return [...g.entries()];
  }, [list]);

  return (
    <div className="scroll">
      <div className="header">
        <div>
          <h1 className="header-title">Ventas</h1>
          <div className="header-sub">{sales.length} totales</div>
        </div>
        <div className="header-actions">
          <button className="icon-btn primary" onClick={() => onGoTo('sales-new')}>
            <PlusIcon style={{ width: 18, height: 18 }} />
          </button>
        </div>
      </div>

      <div className="search-bar">
        <SearchIcon />
        <input placeholder="Buscar por ID o fecha…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px', alignItems: 'center' }}>
        <input
          type="date"
          className="chip"
          style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer' }}
          value={filterFrom}
          onChange={e => setFilterFrom(e.target.value)}
          aria-label="Desde"
        />
        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>—</span>
        <input
          type="date"
          className="chip"
          style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer' }}
          value={filterTo}
          onChange={e => setFilterTo(e.target.value)}
          aria-label="Hasta"
        />
        {(filterFrom || filterTo) && (
          <button className="chip" onClick={() => { setFilterFrom(''); setFilterTo(''); }}
            style={{ color: 'var(--danger)', flexShrink: 0 }}>
            ×
          </button>
        )}
      </div>

      {grouped.map(([day, items]) => {
        const dayTotal = items.reduce((a, s) => a + s.total, 0);
        const dayLabel = day === '2026-05-18' ? 'Hoy' : day === '2026-05-17' ? 'Ayer' : day;
        return (
          <div className="section" key={day}>
            <div className="section-head">
              <div className="section-title">{dayLabel}</div>
              <div className="bars-period">{fmtMoney(dayTotal)} · {items.length} ventas</div>
            </div>
            <div className="list">
              {items.map(s => (
                <div key={s.id} className="list-row" onClick={() => onGoTo('sale-detail', s.id)}>
                  <div className="row-thumb"><ReceiptIcon style={{ width: 16, height: 16, color: 'var(--text-muted)' }} /></div>
                  <div className="row-main">
                    <div className="row-title">Venta #{s.id}</div>
                    <div className="row-meta">
                      <span>{s.fecha.split(' ')[1]}</span>
                      <span className="dot-sep">·</span>
                      <span>{s.items.reduce((a, i) => a + i.cantidad, 0)} ítems · {s.items.length} prod.</span>
                    </div>
                  </div>
                  <div className="row-side">
                    <div className="row-side-main">{fmtMoney(s.total)}</div>
                    <div className="row-side-sub">total</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {grouped.length === 0 && (
        <div className="empty">
          <CartIcon className="empty-icon" />
          <div className="empty-title">Sin ventas</div>
          <div className="empty-sub">Probá con otra búsqueda.</div>
        </div>
      )}
    </div>
  );
}

// ── New Sale ─────────────────────────────────────────────────

interface CartItem { product_id: number; cantidad: number; precio_unitario: number; }

export function MobileNewSale({ products, setProducts, sales, setSales, onGoTo }: {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  onGoTo: GoTo;
}) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [pendingSale, setPendingSale] = useState<Sale | null>(null);

  const visible = useMemo(() => {
    let l = products.filter(p => p.activity && p.cantidad > 0);
    if (query.trim()) {
      const q = query.toLowerCase();
      l = l.filter(p => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q));
    }
    return l;
  }, [products, query]);

  const addToCart = (p: Product) => {
    setCart(c => {
      const ex = c.find(it => it.product_id === p.id);
      if (ex) {
        if (ex.cantidad < p.cantidad) return c.map(it => it.product_id === p.id ? { ...it, cantidad: it.cantidad + 1 } : it);
        toast({ kind: 'warning', title: 'Sin stock', desc: `Solo quedan ${p.cantidad} unidades.` });
        return c;
      }
      return [...c, { product_id: p.id, cantidad: 1, precio_unitario: p.precio }];
    });
  };

  const updateQty = (pid: number, delta: number) => {
    setCart(c => c.flatMap(it => {
      if (it.product_id !== pid) return [it];
      const next = it.cantidad + delta;
      const stock = products.find(p => p.id === pid)?.cantidad || 0;
      if (next <= 0) return [];
      if (next > stock) { toast({ kind: 'warning', title: 'Sin stock', desc: `Solo quedan ${stock} unidades.` }); return [it]; }
      return [{ ...it, cantidad: next }];
    }));
  };

  const subtotal = cart.reduce((a, it) => a + it.cantidad * it.precio_unitario, 0);
  const tax = Math.round(subtotal * 0.21);
  const total = subtotal + tax;
  const itemCount = cart.reduce((a, it) => a + it.cantidad, 0);

  const confirm = async () => {
    if (!cart.length) return;
    const saleItems = cart.map(it => ({ product_id: it.product_id, cantidad: it.cantidad, precio_unitario: it.precio_unitario }));
    const newSale = await createSale(saleItems, total);
    setSales(ss => [...ss, newSale]);
    setProducts(ps => ps.map(p => { const inCart = cart.find(it => it.product_id === p.id); return inCart ? { ...p, cantidad: p.cantidad - inCart.cantidad } : p; }));
    toast({ kind: 'success', title: `Venta #${newSale.id} registrada`, desc: `${cart.length} ítem(s) · ${fmtMoney(total)}` });
    setCart([]); setCartOpen(false); setPendingSale(newSale);
  };

  return (
    <div className="scroll" style={{ paddingBottom: 0 }}>
      <div className="header">
        <div>
          <button className="header-back" onClick={() => onGoTo('sales')}>
            <BackIcon style={{ width: 14, height: 14 }} /> Ventas
          </button>
          <h1 className="header-title">Nueva venta</h1>
          <div className="header-sub">{itemCount} ítem(s) · {fmtMoney(total)}</div>
        </div>
      </div>

      <div className="search-bar">
        <SearchIcon />
        <input autoFocus placeholder="Buscar producto…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>

      <div className="section" style={{ paddingBottom: 120 }}>
        <div className="list">
          {visible.length === 0 ? (
            <div className="empty">
              <BoxIcon className="empty-icon" />
              <div className="empty-title">Sin productos disponibles</div>
              <div className="empty-sub">Ajustá la búsqueda.</div>
            </div>
          ) : visible.map(p => {
            const inCart = cart.find(it => it.product_id === p.id);
            return (
              <div key={p.id} className="list-row">
                <div className="row-thumb">{p.codigo.slice(-4)}</div>
                <div className="row-main">
                  <div className="row-title">{p.nombre}</div>
                  <div className="row-meta">
                    <span>{fmtMoney(p.precio)}</span>
                    <span className="dot-sep">·</span>
                    <span style={{ color: p.cantidad < 10 ? 'var(--warning)' : undefined }}>{p.cantidad} en stock</span>
                  </div>
                </div>
                {inCart ? (
                  <div className="qty">
                    <button onClick={() => updateQty(p.id, -1)}>−</button>
                    <span className="val">{inCart.cantidad}</span>
                    <button onClick={() => updateQty(p.id, +1)}>+</button>
                  </div>
                ) : (
                  <button className="btn sm primary" onClick={() => addToCart(p)}>
                    <PlusIcon style={{ width: 12, height: 12 }} /> Agregar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {cart.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 20, left: 16, right: 16, zIndex: 30,
          background: 'var(--accent)', color: '#0a0a0a',
          borderRadius: 16, padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontWeight: 600, boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          cursor: 'pointer',
        }} onClick={() => setCartOpen(true)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CartIcon style={{ width: 16, height: 16 }} />
            <span style={{ fontFamily: 'var(--font-mono)' }}>{itemCount}</span>
            <span>Ver carrito</span>
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{fmtMoney(total)}</span>
        </div>
      )}

      <NotaVentaModal
        sale={pendingSale}
        products={products}
        isDesktop={false}
        onClose={() => { setPendingSale(null); onGoTo('sales'); }}
      />

      <Sheet open={cartOpen} onClose={() => setCartOpen(false)} title="Carrito" subtitle={`${cart.length} producto(s) · ${itemCount} ítem(s)`}
        footer={<button className="btn primary full" onClick={confirm} disabled={!cart.length}>Confirmar venta · {fmtMoney(total)}</button>}>
        {cart.map(it => {
          const p = products.find(p => p.id === it.product_id);
          if (!p) return null;
          return (
            <div key={it.product_id} className="cart-item">
              <div className="cart-item-main">
                <div className="cart-item-name">{p.nombre}</div>
                <div className="cart-item-meta">{fmtMoney(it.precio_unitario)} · {fmtMoney(it.cantidad * it.precio_unitario)}</div>
              </div>
              <div className="qty">
                <button onClick={() => updateQty(it.product_id, -1)}>−</button>
                <span className="val">{it.cantidad}</span>
                <button onClick={() => updateQty(it.product_id, +1)}>+</button>
              </div>
              <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => setCart(c => c.filter(x => x.product_id !== it.product_id))}>
                <XIcon style={{ width: 13, height: 13 }} />
              </button>
            </div>
          );
        })}
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
          <div className="cart-row"><span>Subtotal</span><span>{fmtMoney(subtotal)}</span></div>
          <div className="cart-row" style={{ marginTop: 6 }}><span>IVA 21%</span><span>{fmtMoney(tax)}</span></div>
          <div className="cart-row total" style={{ marginTop: 8 }}><span>Total</span><span>{fmtMoney(total)}</span></div>
        </div>
      </Sheet>
    </div>
  );
}

// ── Sale Detail ──────────────────────────────────────────────

export function MobileSaleDetail({ saleId, sales, products, onGoTo }: { saleId: number | null; sales: Sale[]; products: Product[]; onGoTo: GoTo }) {
  const sale = sales.find(s => s.id === saleId);
  if (!sale) return (
    <div className="scroll">
      <div className="header"><button className="header-back" onClick={() => onGoTo('sales')}><BackIcon style={{ width: 14, height: 14 }} /> Ventas</button></div>
      <div className="empty"><div className="empty-title">Venta no encontrada</div></div>
    </div>
  );
  return (
    <div className="scroll">
      <div className="header">
        <div>
          <button className="header-back" onClick={() => onGoTo('sales')}><BackIcon style={{ width: 14, height: 14 }} /> Ventas</button>
          <h1 className="header-title">Venta #{sale.id}</h1>
          <div className="header-sub">{sale.fecha}</div>
        </div>
      </div>

      <div className="metric-hero">
        <div className="metric-hero-label"><span className="dot" />Total facturado</div>
        <div className="metric-hero-value">{fmtMoney(sale.total)}</div>
        <div className="metric-hero-meta">
          <Badge kind="ok"><span className="dot" />Completada</Badge>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{sale.items.reduce((a, i) => a + i.cantidad, 0)} unid. · {sale.items.length} prod.</span>
        </div>
      </div>

      <div className="kvgrid">
        <div className="kv"><div className="kv-label">Sale ID</div><div className="kv-value">#{sale.id}</div></div>
        <div className="kv"><div className="kv-label">Productos</div><div className="kv-value">{sale.items.length}</div></div>
        <div className="kv"><div className="kv-label">Unidades</div><div className="kv-value">{sale.items.reduce((a, i) => a + i.cantidad, 0)}</div></div>
        <div className="kv"><div className="kv-label">Promedio</div><div className="kv-value">{fmtMoneyShort(sale.total / sale.items.length)}</div></div>
      </div>

      <div className="section">
        <div className="section-head"><div className="section-title">Ítems · tabla sale_item</div></div>
        <div className="list">
          {sale.items.map(it => {
            const p = products.find(p => p.id === it.product_id);
            return (
              <div key={it.id} className="list-row" onClick={() => p && onGoTo('product-detail', p.id)}>
                <div className="row-thumb">{p ? p.codigo.slice(-4) : '—'}</div>
                <div className="row-main">
                  <div className="row-title">{p ? p.nombre : <span style={{ color: 'var(--text-dim)' }}>(archivado)</span>}</div>
                  <div className="row-meta"><span>{it.cantidad} × {fmtMoney(it.precio_unitario)}</span></div>
                </div>
                <div className="row-side">
                  <div className="row-side-main">{fmtMoney(it.subtotal)}</div>
                  <div className="row-side-sub">subtotal</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Product Detail ────────────────────────────────────────────

export function MobileProductDetail({ productId, products, sales, onGoTo }: { productId: number | null; products: Product[]; sales: Sale[]; onGoTo: GoTo }) {
  const product = products.find(p => p.id === productId);
  if (!product) return (
    <div className="scroll">
      <div className="header"><button className="header-back" onClick={() => onGoTo('products')}><BackIcon style={{ width: 14, height: 14 }} /> Productos</button></div>
      <div className="empty"><div className="empty-title">Producto no encontrado</div></div>
    </div>
  );

  const related = sales.filter(s => s.items.some(it => it.product_id === productId)).sort((a, b) => b.id - a.id);
  const totalUnits = related.reduce((a, s) => a + s.items.filter(it => it.product_id === productId).reduce((b, it) => b + it.cantidad, 0), 0);
  const totalRev = related.reduce((a, s) => a + s.items.filter(it => it.product_id === productId).reduce((b, it) => b + it.subtotal, 0), 0);
  const st = stockStatus(product.cantidad);

  return (
    <div className="scroll">
      <div className="header">
        <div>
          <button className="header-back" onClick={() => onGoTo('products')}><BackIcon style={{ width: 14, height: 14 }} /> Productos</button>
          <h1 className="header-title" style={{ fontSize: 22 }}>{product.nombre}</h1>
          <div className="header-sub">{product.codigo} · ID #{String(product.id).padStart(4,'0')}</div>
        </div>
        <div className="header-actions">
          <Badge kind={st.cls}><span className="dot" />{st.label}</Badge>
        </div>
      </div>

      <div className="kvgrid">
        <div className="kv"><div className="kv-label">Precio</div><div className="kv-value">{fmtMoney(product.precio)}</div></div>
        <div className="kv"><div className="kv-label">Stock actual</div><div className="kv-value">{product.cantidad}</div></div>
        <div className="kv"><div className="kv-label">Unid. vendidas</div><div className="kv-value">{totalUnits}</div></div>
        <div className="kv"><div className="kv-label">Ingresos</div><div className="kv-value" style={{ color: 'var(--accent-text)' }}>{fmtMoneyShort(totalRev)}</div></div>
      </div>

      <div className="section">
        <div className="section-head"><div className="section-title">Historial · {related.length} venta(s)</div></div>
        {related.length === 0 ? (
          <div className="list">
            <div className="empty">
              <CartIcon className="empty-icon" />
              <div className="empty-title">Sin ventas registradas</div>
              <div className="empty-sub">Si se elimina, se borra por completo.</div>
            </div>
          </div>
        ) : (
          <div className="list">
            {related.map(s => {
              const it = s.items.find(i => i.product_id === productId);
              if (!it) return null;
              return (
                <div key={s.id} className="list-row" onClick={() => onGoTo('sale-detail', s.id)}>
                  <div className="row-thumb"><ReceiptIcon style={{ width: 16, height: 16, color: 'var(--text-muted)' }} /></div>
                  <div className="row-main">
                    <div className="row-title">Venta #{s.id}</div>
                    <div className="row-meta"><span>{s.fecha}</span><span className="dot-sep">·</span><span>{it.cantidad} × {fmtMoney(it.precio_unitario)}</span></div>
                  </div>
                  <div className="row-side">
                    <div className="row-side-main">{fmtMoney(it.subtotal)}</div>
                    <div className="row-side-sub">subtotal</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

