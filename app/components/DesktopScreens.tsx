'use client';
import React, { useState, useMemo, useEffect } from 'react';
import type { Product, Sale, Route, DaySales } from '../lib/data';
import { fmtMoney, fmtMoneyShort, stockStatus, productHasSales } from '../lib/data';
import { createProduct, updateProduct, deleteProduct } from '../actions/products';
import { createSale } from '../actions/sales';
import { NotaVentaModal } from './NotaVenta';
import {
  SearchIcon, PlusIcon, TrashIcon, EditIcon, BackIcon, XIcon,
  AlertIcon, ArrowUpIcon, ArrowDownIcon, TrendIcon, BoxIcon, CartIcon, MoreIcon, InfoIcon,
} from './icons';
import { Badge, Modal, SparkBars, useToast } from './ui';

type SharedProps = {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  onGoTo: (name: Route['name'], param?: number | null, extra?: Route['extra']) => void;
};

// ── Dashboard ────────────────────────────────────────────────

export function DesktopDashboard({ products, sales, onGoTo, dailySales }: Pick<SharedProps, 'products' | 'sales' | 'onGoTo'> & { dailySales: DaySales[] }) {
  const active = products.filter(p => p.activity);
  const totalRevenue = sales.reduce((s, x) => s + x.total, 0);
  const totalItems = sales.reduce((s, x) => s + x.items.reduce((a, i) => a + i.cantidad, 0), 0);
  const inventoryValue = active.reduce((s, p) => s + p.precio * p.cantidad, 0);
  const lowStock = active.filter(p => p.cantidad < 10).sort((a, b) => a.cantidad - b.cantidad).slice(0, 6);

  const productSales = useMemo(() => {
    const map = new Map<number, { units: number; revenue: number }>();
    sales.forEach(s => s.items.forEach(it => {
      const cur = map.get(it.product_id) || { units: 0, revenue: 0 };
      cur.units += it.cantidad; cur.revenue += it.subtotal;
      map.set(it.product_id, cur);
    }));
    return [...map.entries()]
      .map(([id, v]) => ({ ...v, product: products.find(p => p.id === id) }))
      .filter(x => x.product)
      .sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [products, sales]);

  const recentSales = [...sales].sort((a, b) => b.id - a.id).slice(0, 6);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Resumen</h1>
          <div className="page-sub">Vista general · actualizado hace 2 min</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm">Últimos 14 días</button>
          <button className="btn btn-primary btn-sm" onClick={() => onGoTo('sales-new')}>
            <PlusIcon style={{ width: 13, height: 13 }} /> Nueva venta
          </button>
        </div>
      </div>

      <div className="metrics-grid">
        <DMetric label="Ingresos totales" value={fmtMoney(totalRevenue)} delta="+12.4%" sub={`${sales.length} ventas`} />
        <DMetric label="Unidades vendidas" value={String(totalItems)} delta="+8.1%" sub="vs. semana anterior" />
        <DMetric label="SKUs activos" value={String(active.length)} sub={`${products.length - active.length} archivados`} />
        <DMetric label="Valor de inventario" value={fmtMoneyShort(inventoryValue)} delta="-2.3%" sub="costo estimado" deltaNeg />
      </div>

      <div className="chart-grid">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Ventas por día</div>
              <div className="metric-sub" style={{ marginTop: 4 }}>Últimos 14 días · ARS</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm">Día</button>
              <button className="btn btn-sm" style={{ background: 'var(--surface-hover)' }}>Semana</button>
              <button className="btn btn-sm">Mes</button>
            </div>
          </div>
          <div className="card-body"><SparkBars data={dailySales} /></div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertIcon style={{ width: 14, height: 14, color: 'var(--warning)' }} /> Stock bajo
            </div>
            <Badge kind="warn"><span className="dot" />{lowStock.length} alertas</Badge>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {lowStock.length === 0 ? (
              <div className="empty" style={{ padding: '32px 16px' }}>
                <div className="empty-sub">Todo el inventario está en niveles saludables.</div>
              </div>
            ) : lowStock.map(p => (
              <div key={p.id} className="cart-item" style={{ padding: '10px 16px' }}>
                <div>
                  <div className="cart-item-name">{p.nombre}</div>
                  <div className="cart-item-meta">{p.codigo} · {fmtMoney(p.precio)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="num" style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500, color: p.cantidad === 0 ? 'var(--danger)' : 'var(--warning)' }}>
                    {p.cantidad}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    unidades
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="chart-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="card">
          <div className="card-head">
            <div className="card-title">Top productos</div>
            <button className="btn btn-ghost btn-sm" onClick={() => onGoTo('products')}>Ver todos →</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table">
              <thead><tr><th>Producto</th><th className="right">Unid.</th><th className="right">Ingresos</th></tr></thead>
              <tbody>
                {productSales.map(({ product, units, revenue }) => product ? (
                  <tr key={product.id} onClick={() => onGoTo('product-detail', product.id)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{product.nombre}</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: 11.5, fontFamily: 'var(--font-mono)', marginTop: 2 }}>{product.codigo}</div>
                    </td>
                    <td className="right num">{units}</td>
                    <td className="right num" style={{ fontWeight: 500 }}>{fmtMoney(revenue)}</td>
                  </tr>
                ) : null)}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div className="card-title">Ventas recientes</div>
            <button className="btn btn-ghost btn-sm" onClick={() => onGoTo('sales')}>Ver todas →</button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="table">
              <thead><tr><th>Venta</th><th>Fecha</th><th className="right">Ítems</th><th className="right">Total</th></tr></thead>
              <tbody>
                {recentSales.map(s => (
                  <tr key={s.id} onClick={() => onGoTo('sale-detail', s.id)} style={{ cursor: 'pointer' }}>
                    <td className="id-cell">#{s.id}</td>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.fecha}</td>
                    <td className="right num">{s.items.reduce((a, i) => a + i.cantidad, 0)}</td>
                    <td className="right num" style={{ fontWeight: 500 }}>{fmtMoney(s.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function DMetric({ label, value, delta, sub, deltaNeg }: { label: string; value: string; delta?: string; sub?: string; deltaNeg?: boolean }) {
  return (
    <div className="metric">
      <div className="metric-label"><span className="dot" />{label}</div>
      <div className="metric-value">{value}</div>
      <div className="metric-meta">
        {delta ? (
          <span className={`metric-delta ${deltaNeg ? 'neg' : ''}`}>
            {deltaNeg ? <ArrowDownIcon style={{ width: 10, height: 10 }} /> : <ArrowUpIcon style={{ width: 10, height: 10 }} />}
            {delta}
          </span>
        ) : <span className="metric-sub">—</span>}
        <span className="metric-sub">{sub}</span>
      </div>
    </div>
  );
}

// ── Products ─────────────────────────────────────────────────

export function DesktopProducts({ products, setProducts, sales, onGoTo }: SharedProps) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [sort, setSort] = useState<{ key: keyof Product; dir: 'asc' | 'desc' }>({ key: 'id', dir: 'asc' });
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<{ id: number; field: string } | null>(null);
  const [draft, setDraft] = useState('');

  const visible = useMemo(() => {
    let list = products.filter(p => p.activity);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q) ||
        String(p.id).includes(q));
    }
    if (stockFilter === 'low') list = list.filter(p => p.cantidad > 0 && p.cantidad < 10);
    if (stockFilter === 'out') list = list.filter(p => p.cantidad === 0);
    return [...list].sort((a, b) => {
      const va = a[sort.key] as string | number;
      const vb = b[sort.key] as string | number;
      if (va < vb) return sort.dir === 'asc' ? -1 : 1;
      if (va > vb) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [products, query, stockFilter, sort]);

  const toggleSort = (key: keyof Product) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  const handleDelete = async (product: Product) => {
    if (productHasSales(product.id, sales)) {
      setProducts(ps => ps.map(p => p.id === product.id ? { ...p, activity: false } : p));
      toast({ kind: 'info', title: `${product.nombre} archivado`, desc: 'Tiene ventas asociadas. Se marcó como inactivo y se oculta del catálogo.' });
    } else {
      setProducts(ps => ps.filter(p => p.id !== product.id));
      toast({ kind: 'success', title: `${product.nombre} eliminado`, desc: 'Sin ventas registradas. Se eliminó por completo.' });
    }
    await deleteProduct(product.id);
  };

  const handleAdd = async (data: { codigo: string; nombre: string; precio: string; cantidad: string }) => {
    const nextId = (products.reduce((m, p) => Math.max(m, p.id), 0) || 0) + 1;
    const result = await createProduct({
      codigo: data.codigo || `ART-${String(nextId).padStart(4, '0')}`,
      nombre: data.nombre,
      precio: Number(data.precio) || 0,
      cantidad: Number(data.cantidad) || 0,
    });
    setProducts(ps => [...ps, result]);
    toast({ kind: 'success', title: 'Producto agregado', desc: `${data.nombre} se agregó al catálogo.` });
    setAddOpen(false);
  };

  const startEdit = (id: number, field: string, current: string | number) => {
    setEditing({ id, field }); setDraft(String(current));
  };
  const commitEdit = async () => {
    if (!editing) return;
    const v: string | number = (editing.field === 'precio' || editing.field === 'cantidad') ? (Number(draft) || 0) : draft;
    const result = await updateProduct(editing.id, { [editing.field]: v } as Partial<Omit<Product, 'id'>>);
    setProducts(ps => ps.map(p => p.id === editing.id ? result : p));
    setEditing(null);
  };

  const nextId = (products.reduce((m, p) => Math.max(m, p.id), 0) || 0) + 1;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Productos</h1>
          <div className="page-sub">{visible.length} de {products.filter(p => p.activity).length} productos activos · doble-click para editar</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm">Exportar CSV</button>
          <button className="btn btn-primary btn-sm" onClick={() => setAddOpen(true)}>
            <PlusIcon style={{ width: 13, height: 13 }} /> Agregar producto
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="toolbar-search">
            <SearchIcon />
            <input placeholder="Buscar por nombre, código o ID…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <button className="chip-filter"
                  onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
                  style={stockFilter === 'low' ? { borderColor: 'var(--warning)', color: 'var(--warning)' } : undefined}>
            <AlertIcon style={{ width: 11, height: 11 }} /> Stock bajo
            {stockFilter === 'low' && <span className="x">×</span>}
          </button>
          <button className="chip-filter"
                  onClick={() => setStockFilter(stockFilter === 'out' ? 'all' : 'out')}
                  style={stockFilter === 'out' ? { borderColor: 'var(--danger)', color: 'var(--danger)' } : undefined}>
            Sin stock {stockFilter === 'out' && <span className="x">×</span>}
          </button>
          <div style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            {visible.length} resultados
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 60 }}><SortBtn label="ID" k="id" sort={sort} onClick={toggleSort} /></th>
              <th style={{ width: 110 }}><SortBtn label="Código" k="codigo" sort={sort} onClick={toggleSort} /></th>
              <th><SortBtn label="Nombre" k="nombre" sort={sort} onClick={toggleSort} /></th>
              <th style={{ width: 130 }} className="right"><SortBtn label="Precio" k="precio" sort={sort} onClick={toggleSort} right /></th>
              <th style={{ width: 170 }} className="right"><SortBtn label="Stock" k="cantidad" sort={sort} onClick={toggleSort} right /></th>
              <th style={{ width: 110 }}>Estado</th>
              <th style={{ width: 90 }}></th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr><td colSpan={7}>
                <div className="empty">
                  <BoxIcon className="empty-icon" />
                  <div className="empty-title">Sin resultados</div>
                  <div className="empty-sub">Probá con otra búsqueda.</div>
                </div>
              </td></tr>
            ) : visible.map(p => {
              const st = stockStatus(p.cantidad);
              const pct = Math.min((p.cantidad / 50) * 100, 100);
              const isEditing = (field: string) => editing?.id === p.id && editing?.field === field;
              return (
                <tr key={p.id} className={editing?.id === p.id ? 'editing' : ''}>
                  <td className="id-cell">{String(p.id).padStart(4, '0')}</td>
                  <td><span className="num" style={{ color: 'var(--text-muted)' }}>{p.codigo}</span></td>
                  <td onDoubleClick={() => startEdit(p.id, 'nombre', p.nombre)} style={{ cursor: 'text' }}>
                    {isEditing('nombre') ? (
                      <input autoFocus className="inline-edit"
                             value={draft} onChange={e => setDraft(e.target.value)}
                             onBlur={commitEdit}
                             onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null); }} />
                    ) : <span style={{ fontWeight: 500 }}>{p.nombre}</span>}
                  </td>
                  <td className="right" onDoubleClick={() => startEdit(p.id, 'precio', p.precio)} style={{ cursor: 'text' }}>
                    {isEditing('precio') ? (
                      <input autoFocus type="number" className="inline-edit num"
                             value={draft} onChange={e => setDraft(e.target.value)}
                             onBlur={commitEdit}
                             onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null); }} />
                    ) : <span className="num" style={{ fontWeight: 500 }}>{fmtMoney(p.precio)}</span>}
                  </td>
                  <td className="right" onDoubleClick={() => startEdit(p.id, 'cantidad', p.cantidad)} style={{ cursor: 'text' }}>
                    {isEditing('cantidad') ? (
                      <input autoFocus type="number" className="inline-edit num"
                             value={draft} onChange={e => setDraft(e.target.value)}
                             onBlur={commitEdit}
                             onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null); }} />
                    ) : (
                      <>
                        <span className="stock-bar">
                          <span className={`stock-bar-fill ${p.cantidad === 0 ? 'danger' : p.cantidad < 10 ? 'warn' : ''}`} style={{ width: `${pct}%` }} />
                        </span>
                        <span className="num">{p.cantidad}</span>
                      </>
                    )}
                  </td>
                  <td><Badge kind={st.cls}><span className="dot" />{st.label}</Badge></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-ghost btn-sm btn-icon" title="Ver historial" onClick={() => onGoTo('product-detail', p.id)}>
                        <TrendIcon style={{ width: 13, height: 13 }} />
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" title="Editar" onClick={() => startEdit(p.id, 'nombre', p.nombre)}>
                        <EditIcon style={{ width: 13, height: 13 }} />
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon btn-danger" title="Eliminar" onClick={() => handleDelete(p)}>
                        <TrashIcon style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AddProductModal open={addOpen} onClose={() => setAddOpen(false)} onAdd={handleAdd} nextId={nextId} />
    </div>
  );
}

function SortBtn({ label, k, sort, onClick, right }: {
  label: string; k: keyof Product;
  sort: { key: keyof Product; dir: 'asc' | 'desc' };
  onClick: (k: keyof Product) => void; right?: boolean;
}) {
  const active = sort.key === k;
  return (
    <button onClick={() => onClick(k)}
            style={{ background: 'none', border: 'none', color: 'inherit', font: 'inherit',
                     cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4,
                     textTransform: 'inherit', letterSpacing: 'inherit', marginLeft: right ? 'auto' : 0 }}>
      {label}
      <span style={{ opacity: active ? 1 : 0.3, fontSize: 9 }}>{active ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}</span>
    </button>
  );
}

function AddProductModal({ open, onClose, onAdd, nextId }: {
  open: boolean; onClose: () => void;
  onAdd: (d: { codigo: string; nombre: string; precio: string; cantidad: string }) => void;
  nextId: number;
}) {
  const [data, setData] = useState({ codigo: '', nombre: '', precio: '', cantidad: '' });
  useEffect(() => {
    if (open) setData({ codigo: `ART-${String(nextId).padStart(4, '0')}`, nombre: '', precio: '', cantidad: '' });
  }, [open, nextId]);
  const canSave = data.nombre.trim() && data.precio !== '' && data.cantidad !== '';
  return (
    <Modal open={open} onClose={onClose}
      title="Agregar producto"
      subtitle={`ID #${String(nextId).padStart(4, '0')} · se asignará al guardar`}
      footer={
        <>
          <button className="btn btn-sm" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary btn-sm" disabled={!canSave}
                  style={!canSave ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
                  onClick={() => canSave && onAdd(data)}>Guardar producto</button>
        </>
      }>
      <div className="form-row">
        <div className="field">
          <label className="field-label">Código</label>
          <input className="input mono" value={data.codigo} onChange={e => setData(d => ({ ...d, codigo: e.target.value }))} />
        </div>
        <div className="field">
          <label className="field-label">ID</label>
          <input className="input mono" value={String(nextId).padStart(4, '0')} disabled style={{ opacity: 0.55 }} />
        </div>
      </div>
      <div className="field">
        <label className="field-label">Nombre</label>
        <input className="input" placeholder="ej. Auriculares Bluetooth K7" autoFocus
               value={data.nombre} onChange={e => setData(d => ({ ...d, nombre: e.target.value }))} />
      </div>
      <div className="form-row">
        <div className="field">
          <label className="field-label">Precio unitario</label>
          <input className="input mono" type="number" placeholder="0"
                 value={data.precio} onChange={e => setData(d => ({ ...d, precio: e.target.value }))} />
          <div className="field-hint">En ARS, sin separadores.</div>
        </div>
        <div className="field">
          <label className="field-label">Cantidad inicial</label>
          <input className="input mono" type="number" placeholder="0"
                 value={data.cantidad} onChange={e => setData(d => ({ ...d, cantidad: e.target.value }))} />
          <div className="field-hint">Stock disponible al cargar.</div>
        </div>
      </div>
      <div style={{ background: 'var(--bg-elev)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <InfoIcon style={{ width: 14, height: 14, marginTop: 2, color: 'var(--text-muted)' }} />
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          El campo <code style={{ fontFamily: 'var(--font-mono)' }}>activity</code> se inicializa en <b>true</b>. Si el producto recibe ventas y luego es eliminado, se marcará como <b>false</b>.
        </div>
      </div>
    </Modal>
  );
}

// ── Sales ────────────────────────────────────────────────────

export function DesktopSales({ products, sales, onGoTo }: Pick<SharedProps, 'products' | 'sales' | 'onGoTo'>) {
  const [query, setQuery] = useState('');
  const list = useMemo(() => {
    let l = [...sales].sort((a, b) => b.id - a.id);
    if (query.trim()) {
      const q = query.toLowerCase();
      l = l.filter(s => String(s.id).includes(q) || s.fecha.toLowerCase().includes(q) ||
        s.items.some(it => { const p = products.find(p => p.id === it.product_id); return p && p.nombre.toLowerCase().includes(q); }));
    }
    return l;
  }, [sales, query, products]);
  const todayTotal = sales.filter(s => s.fecha.startsWith('2026-05-18')).reduce((a, s) => a + s.total, 0);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Ventas</h1>
          <div className="page-sub">{sales.length} ventas · {fmtMoney(todayTotal)} facturado hoy</div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm">Exportar CSV</button>
          <button className="btn btn-primary btn-sm" onClick={() => onGoTo('sales-new')}>
            <PlusIcon style={{ width: 13, height: 13 }} /> Nueva venta
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <div className="toolbar-search">
            <SearchIcon />
            <input placeholder="Buscar por ID, fecha o producto…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <button className="chip-filter">Hoy</button>
          <button className="chip-filter">Esta semana</button>
          <div style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{list.length} resultados</div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 90 }}>Sale ID</th>
              <th style={{ width: 170 }}>Fecha</th>
              <th>Productos</th>
              <th style={{ width: 90 }} className="right">Ítems</th>
              <th style={{ width: 140 }} className="right">Total</th>
              <th style={{ width: 60 }}></th>
            </tr>
          </thead>
          <tbody>
            {list.map(s => (
              <tr key={s.id} onClick={() => onGoTo('sale-detail', s.id)} style={{ cursor: 'pointer' }}>
                <td className="id-cell">#{s.id}</td>
                <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.fecha}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {s.items.slice(0, 3).map(it => {
                      const p = products.find(p => p.id === it.product_id);
                      return p ? (
                        <span key={it.id} className="badge" style={{ background: 'var(--bg-elev)' }}>
                          {p.nombre} <span style={{ color: 'var(--text-dim)' }}>×{it.cantidad}</span>
                        </span>
                      ) : null;
                    })}
                    {s.items.length > 3 && <span className="badge" style={{ background: 'var(--bg-elev)' }}>+{s.items.length - 3} más</span>}
                  </div>
                </td>
                <td className="right num">{s.items.reduce((a, i) => a + i.cantidad, 0)}</td>
                <td className="right num" style={{ fontWeight: 500 }}>{fmtMoney(s.total)}</td>
                <td><div className="row-actions"><button className="btn btn-ghost btn-sm btn-icon"><MoreIcon style={{ width: 13, height: 13 }} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── New Sale ─────────────────────────────────────────────────

interface CartItem { product_id: number; cantidad: number; precio_unitario: number; }

export function DesktopNewSale({ products, setProducts, sales, setSales, onGoTo }: SharedProps) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pendingSale, setPendingSale] = useState<import('../lib/data').Sale | null>(null);

  const visible = useMemo(() => {
    let l = products.filter(p => p.activity && p.cantidad > 0);
    if (query.trim()) {
      const q = query.toLowerCase();
      l = l.filter(p => p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q));
    }
    return l.slice(0, 10);
  }, [products, query]);

  const addToCart = (p: Product) => {
    setCart(c => {
      const ex = c.find(it => it.product_id === p.id);
      if (ex) {
        if (ex.cantidad < p.cantidad) return c.map(it => it.product_id === p.id ? { ...it, cantidad: it.cantidad + 1 } : it);
        toast({ kind: 'warning', title: 'Sin stock', desc: `Solo quedan ${p.cantidad}.` });
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
      if (next > stock) { toast({ kind: 'warning', title: 'Sin stock', desc: `Solo quedan ${stock}.` }); return [it]; }
      return [{ ...it, cantidad: next }];
    }));
  };

  const subtotal = cart.reduce((a, it) => a + it.cantidad * it.precio_unitario, 0);
  const tax = Math.round(subtotal * 0.21);
  const total = subtotal + tax;

  const confirm = async () => {
    if (!cart.length) return;
    const saleItems = cart.map(it => ({ product_id: it.product_id, cantidad: it.cantidad, precio_unitario: it.precio_unitario }));
    const newSale = await createSale(saleItems, total);
    setSales(ss => [...ss, newSale]);
    setProducts(ps => ps.map(p => { const inCart = cart.find(it => it.product_id === p.id); return inCart ? { ...p, cantidad: p.cantidad - inCart.cantidad } : p; }));
    toast({ kind: 'success', title: `Venta #${newSale.id} registrada`, desc: `${cart.length} ítem(s) · ${fmtMoney(total)}` });
    setCart([]);
    setPendingSale(newSale);
  };

  return (
    <div className="page">
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onGoTo('sales')}>
            <BackIcon style={{ width: 13, height: 13 }} />
          </button>
          <div>
            <h1 className="page-title">Nueva venta</h1>
            <div className="page-sub">Buscá productos y agregalos al carrito</div>
          </div>
        </div>
      </div>

      <div className="split">
        <div className="card">
          <div className="card-head">
            <div className="card-title">Catálogo</div>
            <div style={{ width: 280 }} className="toolbar-search">
              <SearchIcon />
              <input autoFocus placeholder="Buscar producto…" value={query} onChange={e => setQuery(e.target.value)} />
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 110 }}>Código</th>
                <th>Nombre</th>
                <th className="right" style={{ width: 130 }}>Precio</th>
                <th className="right" style={{ width: 110 }}>Stock</th>
                <th style={{ width: 130 }}></th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td colSpan={5}><div className="empty"><BoxIcon className="empty-icon" /><div className="empty-title">No hay productos</div></div></td></tr>
              ) : visible.map(p => {
                const inCart = cart.find(it => it.product_id === p.id);
                return (
                  <tr key={p.id}>
                    <td><span className="num" style={{ color: 'var(--text-muted)' }}>{p.codigo}</span></td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                      <div style={{ color: 'var(--text-dim)', fontSize: 11.5, fontFamily: 'var(--font-mono)', marginTop: 2 }}>ID #{String(p.id).padStart(4,'0')}</div>
                    </td>
                    <td className="right num" style={{ fontWeight: 500 }}>{fmtMoney(p.precio)}</td>
                    <td className="right num" style={{ color: p.cantidad < 10 ? 'var(--warning)' : 'var(--text-muted)' }}>{p.cantidad}</td>
                    <td className="right">
                      <button className={inCart ? 'btn btn-sm' : 'btn btn-primary btn-sm'}
                              onClick={() => addToCart(p)}
                              style={inCart ? { background: 'var(--accent-soft)', color: 'var(--accent-text)', borderColor: 'transparent' } : undefined}>
                        {inCart ? <>En carrito · {inCart.cantidad}</> : <><PlusIcon style={{ width: 12, height: 12 }} /> Agregar</>}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card cart">
          <div className="card-head">
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CartIcon style={{ width: 14, height: 14 }} /> Carrito
            </div>
            <Badge>{cart.length} ítem(s)</Badge>
          </div>
          <div className="cart-list">
            {cart.length === 0 ? (
              <div className="cart-empty">Tu carrito está vacío.<br /><span style={{ color: 'var(--text-dim)', fontSize: 11.5 }}>Agregá productos desde el catálogo.</span></div>
            ) : cart.map(it => {
              const p = products.find(p => p.id === it.product_id);
              if (!p) return null;
              return (
                <div key={it.product_id} className="cart-item">
                  <div>
                    <div className="cart-item-name">{p.nombre}</div>
                    <div className="cart-item-meta">{fmtMoney(it.precio_unitario)} · subtotal {fmtMoney(it.cantidad * it.precio_unitario)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div className="qty-control">
                      <button onClick={() => updateQty(it.product_id, -1)}>−</button>
                      <input readOnly value={it.cantidad} />
                      <button onClick={() => updateQty(it.product_id, +1)}>+</button>
                    </div>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setCart(c => c.filter(x => x.product_id !== it.product_id))}>
                      <XIcon style={{ width: 12, height: 12 }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="cart-totals">
            <div className="cart-row"><span>Subtotal</span><span>{fmtMoney(subtotal)}</span></div>
            <div className="cart-row"><span>IVA 21%</span><span>{fmtMoney(tax)}</span></div>
            <div className="cart-row total"><span>Total</span><span>{fmtMoney(total)}</span></div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 10, height: 36, justifyContent: 'center', opacity: cart.length === 0 ? 0.5 : 1, cursor: cart.length === 0 ? 'not-allowed' : 'pointer' }}
                    disabled={cart.length === 0} onClick={confirm}>
              Confirmar venta · {fmtMoney(total)}
            </button>
          </div>
        </div>
      </div>
      <NotaVentaModal
        sale={pendingSale}
        products={products}
        isDesktop={true}
        onClose={() => { setPendingSale(null); onGoTo('sales'); }}
      />
    </div>
  );
}


// ── Sale Detail ──────────────────────────────────────────────

export function DesktopSaleDetail({ saleId, products, sales, onGoTo }: { saleId: number | null; products: Product[]; sales: Sale[]; onGoTo: SharedProps['onGoTo'] }) {
  const sale = sales.find(s => s.id === saleId);
  if (!sale) return (
    <div className="page">
      <button className="btn btn-sm" onClick={() => onGoTo('sales')}>← Volver</button>
      <div className="empty" style={{ marginTop: 40 }}><div className="empty-title">Venta no encontrada</div></div>
    </div>
  );
  return (
    <div className="page">
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onGoTo('sales')}>
            <BackIcon style={{ width: 13, height: 13 }} />
          </button>
          <div>
            <h1 className="page-title">Venta #{sale.id}</h1>
            <div className="page-sub" style={{ fontFamily: 'var(--font-mono)' }}>{sale.fecha}</div>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn-sm">Imprimir</button>
          <button className="btn btn-sm">Reenviar comprobante</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="detail-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <div className="detail-name">{fmtMoney(sale.total)}</div>
              <div className="detail-code">Total facturado · {sale.items.length} ítem(s)</div>
            </div>
            <Badge kind="ok"><span className="dot" />Completada</Badge>
          </div>
        </div>
        <div className="kvgrid">
          <div className="kv"><div className="kv-label">Sale ID</div><div className="kv-value">#{sale.id}</div></div>
          <div className="kv"><div className="kv-label">Ítems</div><div className="kv-value">{sale.items.reduce((a, i) => a + i.cantidad, 0)}</div></div>
          <div className="kv"><div className="kv-label">Productos únicos</div><div className="kv-value">{sale.items.length}</div></div>
          <div className="kv"><div className="kv-label">Total</div><div className="kv-value" style={{ color: 'var(--accent-text)' }}>{fmtMoney(sale.total)}</div></div>
        </div>
      </div>

      <div className="table-wrap">
        <div className="card-head" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="card-title">Ítems de la venta</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>tabla sale_item</div>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 60 }}>ID</th>
              <th style={{ width: 100 }}>Producto</th>
              <th>Nombre</th>
              <th className="right" style={{ width: 100 }}>Cant.</th>
              <th className="right" style={{ width: 130 }}>Precio unit.</th>
              <th className="right" style={{ width: 140 }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map(it => {
              const p = products.find(p => p.id === it.product_id);
              return (
                <tr key={it.id} style={{ cursor: p ? 'pointer' : 'default' }} onClick={() => p && onGoTo('product-detail', p.id)}>
                  <td className="id-cell">{String(it.id).padStart(4, '0')}</td>
                  <td><span className="num" style={{ color: 'var(--text-muted)' }}>{p ? p.codigo : '—'}</span></td>
                  <td style={{ fontWeight: 500 }}>{p ? p.nombre : <span style={{ color: 'var(--text-dim)' }}>(producto archivado)</span>}</td>
                  <td className="right num">{it.cantidad}</td>
                  <td className="right num">{fmtMoney(it.precio_unitario)}</td>
                  <td className="right num" style={{ fontWeight: 500 }}>{fmtMoney(it.subtotal)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} className="right" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>Total</td>
              <td className="right num" style={{ fontSize: 15, fontWeight: 600 }}>{fmtMoney(sale.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ── Product Detail ────────────────────────────────────────────

export function DesktopProductDetail({ productId, products, sales, onGoTo }: { productId: number | null; products: Product[]; sales: Sale[]; onGoTo: SharedProps['onGoTo'] }) {
  const product = products.find(p => p.id === productId);
  if (!product) return (
    <div className="page">
      <button className="btn btn-sm" onClick={() => onGoTo('products')}>← Volver</button>
      <div className="empty" style={{ marginTop: 40 }}><div className="empty-title">Producto no encontrado</div></div>
    </div>
  );
  const related = sales.filter(s => s.items.some(it => it.product_id === productId)).sort((a, b) => b.id - a.id);
  const totalUnits = related.reduce((a, s) => a + s.items.filter(it => it.product_id === productId).reduce((b, it) => b + it.cantidad, 0), 0);
  const totalRev = related.reduce((a, s) => a + s.items.filter(it => it.product_id === productId).reduce((b, it) => b + it.subtotal, 0), 0);
  const st = stockStatus(product.cantidad);

  return (
    <div className="page">
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onGoTo('products')}>
            <BackIcon style={{ width: 13, height: 13 }} />
          </button>
          <div>
            <h1 className="page-title">{product.nombre}</h1>
            <div className="page-sub" style={{ fontFamily: 'var(--font-mono)' }}>
              {product.codigo} · ID #{String(product.id).padStart(4, '0')}
              {!product.activity && <span style={{ color: 'var(--danger)', marginLeft: 10 }}>· INACTIVO</span>}
            </div>
          </div>
        </div>
        <div className="page-actions">
          <Badge kind={st.cls}><span className="dot" />{st.label}</Badge>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="kvgrid" style={{ borderTop: 'none' }}>
          <div className="kv"><div className="kv-label">Precio</div><div className="kv-value">{fmtMoney(product.precio)}</div></div>
          <div className="kv"><div className="kv-label">Stock actual</div><div className="kv-value">{product.cantidad}</div></div>
          <div className="kv"><div className="kv-label">Unid. vendidas</div><div className="kv-value">{totalUnits}</div></div>
          <div className="kv"><div className="kv-label">Ingresos generados</div><div className="kv-value" style={{ color: 'var(--accent-text)' }}>{fmtMoney(totalRev)}</div></div>
        </div>
      </div>

      <div className="section-head">
        <div>
          <div className="section-title">Historial de ventas</div>
          <div className="section-sub">{related.length} venta(s) incluyen este producto</div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 100 }}>Sale ID</th>
              <th style={{ width: 170 }}>Fecha</th>
              <th className="right" style={{ width: 100 }}>Cantidad</th>
              <th className="right" style={{ width: 140 }}>Precio unit.</th>
              <th className="right" style={{ width: 140 }}>Subtotal</th>
              <th className="right" style={{ width: 140 }}>Total venta</th>
            </tr>
          </thead>
          <tbody>
            {related.length === 0 ? (
              <tr><td colSpan={6}>
                <div className="empty">
                  <CartIcon className="empty-icon" />
                  <div className="empty-title">Sin ventas registradas</div>
                  <div className="empty-sub">Si lo eliminás, se borra por completo.</div>
                </div>
              </td></tr>
            ) : related.map(s => {
              const it = s.items.find(i => i.product_id === productId);
              if (!it) return null;
              return (
                <tr key={s.id} onClick={() => onGoTo('sale-detail', s.id)} style={{ cursor: 'pointer' }}>
                  <td className="id-cell">#{s.id}</td>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{s.fecha}</td>
                  <td className="right num">{it.cantidad}</td>
                  <td className="right num">{fmtMoney(it.precio_unitario)}</td>
                  <td className="right num" style={{ fontWeight: 500 }}>{fmtMoney(it.subtotal)}</td>
                  <td className="right num" style={{ color: 'var(--text-muted)' }}>{fmtMoney(s.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
