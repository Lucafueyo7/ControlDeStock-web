'use client';
import { useState } from 'react';
import type { Sale, Product } from '../lib/data';
import { fmtMoney } from '../lib/data';
import { Modal, Sheet } from './ui';

export interface CustomerInfo {
  nombre: string;
  dniCuit: string;
  razonSocial: string;
  empresa: string;
  direccion: string;
  cpCiudad: string;
}

// ── Datos del emisor ─────────────────────────────────────────
const EMPRESA_NOMBRE = 'SHOWROOM\nHOGAR';
const EMPRESA_TELEFONO = '2915131844';

// ── Helpers ──────────────────────────────────────────────────

function fmtARS(n: number) {
  return 'ARS $ ' + Math.round(n).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtFecha(fecha: string) {
  try {
    const d = new Date(fecha);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  } catch {
    return fecha;
  }
}

// ── Generador de PDF (ventana de impresión) ───────────────────

export function abrirNotaPDF(sale: Sale, products: Product[], customer: CustomerInfo) {
  const subtotal = sale.items.reduce((a, i) => a + i.subtotal, 0);
  const iva = sale.total - subtotal;

  const filas = sale.items.map(item => {
    const p = products.find(x => x.id === item.product_id);
    return `
      <tr>
        <td class="col-desc">${p?.nombre ?? 'Producto'}</td>
        <td class="col-qty">${item.cantidad}</td>
        <td class="col-unit">${fmtARS(item.precio_unitario)}</td>
        <td class="col-total">${fmtARS(item.subtotal)}</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Nota de Venta N.º ${String(sale.id).padStart(6, '0')}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm 15mm 20mm 15mm; }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Helvetica, Arial, sans-serif;
      font-size: 10pt;
      color: #000;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Encabezado ── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
    }
    .header-tel   { font-size: 10pt; margin-bottom: 6px; }
    .header-title { font-size: 22pt; font-weight: bold; color: #203864; margin-bottom: 4px; }
    .header-fecha { font-size: 10pt; font-weight: bold; color: #203864; }
    .empresa-box {
      background: #e6e6e6;
      border: 1.2px solid #bfbfbf;
      padding: 10px 18px;
      text-align: center;
      min-width: 108px;
    }
    .empresa-box-name { font-size: 14pt; font-weight: bold; color: #203864; line-height: 1.25; white-space: pre-line; }

    /* ── Datos del cliente ── */
    .cliente-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; }
    .cliente-col { width: 72%; }
    .cliente-label { font-size: 10pt; font-weight: bold; color: #203864; margin-bottom: 8px; }
    .cliente-table { border-collapse: collapse; width: 100%; }
    .cliente-table td { font-size: 10pt; padding: 2px 0; vertical-align: top; }
    .cliente-table .field-name  { width: 48%; color: #000; }
    .cliente-table .field-value { color: #000; font-weight: bold; padding-left: 8px; }
    .venta-num-col { text-align: right; }
    .venta-num-label { font-size: 10pt; font-weight: bold; color: #203864; }
    .venta-num-value { font-size: 10pt; font-weight: bold; margin-top: 4px; }

    /* ── Tabla de ítems ── */
    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    .items-table thead tr {
      border-top: 1.2px solid #203864;
      border-bottom: 1.2px solid #203864;
    }
    .items-table th {
      font-size: 10pt; font-weight: bold; color: #203864;
      padding: 6px 8px; background: #fff;
    }
    .items-table th.col-desc  { text-align: left; }
    .items-table th.col-qty   { text-align: center; }
    .items-table th.col-unit  { text-align: right; }
    .items-table th.col-total { text-align: right; }
    .items-table td { font-size: 10pt; padding: 6px 8px; color: #203864; }
    .items-table td.col-desc  { text-align: left; }
    .items-table td.col-qty   { text-align: center; }
    .items-table td.col-unit  { text-align: right; }
    .items-table td.col-total { text-align: right; }
    .items-table tbody tr { border-bottom: 0.5px solid #e0e0e0; }

    /* ── Totales ── */
    .totales { text-align: right; }
    .totales-subtotal { font-size: 10pt; color: #555; margin-bottom: 3px; }
    .totales-iva      { font-size: 10pt; color: #555; margin-bottom: 6px; }
    .totales-total    { font-size: 11pt; font-weight: bold; color: #203864; border-top: 1px solid #203864; padding-top: 6px; }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="header-tel">Telefono: ${EMPRESA_TELEFONO}</div>
      <div class="header-title">Nota de Venta</div>
      <div class="header-fecha">Fecha: ${fmtFecha(sale.fecha)}</div>
    </div>
    <div class="empresa-box">
      <div class="empresa-box-name">${EMPRESA_NOMBRE}</div>
    </div>
  </div>

  <div class="cliente-section">
    <div class="cliente-col">
      <div class="cliente-label">A la atención de</div>
      <table class="cliente-table">
        <tbody>
          <tr>
            <td class="field-name">Nombre</td>
            <td class="field-value">${customer.nombre || '—'}</td>
          </tr>
          <tr>
            <td class="field-name">DNI / CUIT / CUIL</td>
            <td class="field-value">${customer.dniCuit || '—'}</td>
          </tr>
          ${customer.razonSocial ? `<tr><td class="field-name">Razón social</td><td class="field-value">${customer.razonSocial}</td></tr>` : ''}
          ${customer.empresa ? `<tr><td class="field-name">Nombre de la empresa</td><td class="field-value">${customer.empresa}</td></tr>` : ''}
          ${customer.direccion ? `<tr><td class="field-name">Dirección postal</td><td class="field-value">${customer.direccion}</td></tr>` : ''}
          ${customer.cpCiudad ? `<tr><td class="field-name">CP — Ciudad (Provincia)</td><td class="field-value">${customer.cpCiudad}</td></tr>` : ''}
        </tbody>
      </table>
    </div>
    <div class="venta-num-col">
      <div class="venta-num-label">N.º de Venta</div>
      <div class="venta-num-value">${String(sale.id).padStart(6, '0')}</div>
    </div>
  </div>

  <table class="items-table">
    <thead>
      <tr>
        <th class="col-desc">Descripción</th>
        <th class="col-qty">Cantidad</th>
        <th class="col-unit">Precio unitario</th>
        <th class="col-total">Precio total</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>

  <div class="totales">
    ${iva > 0 ? `
    <div class="totales-subtotal">Subtotal: ${fmtARS(subtotal)}</div>
    <div class="totales-iva">IVA (21%): ${fmtARS(iva)}</div>
    ` : ''}
    <div class="totales-total">TOTAL: ${fmtARS(sale.total)}</div>
  </div>

  <script>
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 300);
    });
  </script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=900,height=1100');
  if (!win) {
    alert('Bloqueado por el navegador. Permitir pop-ups para este sitio.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}

// ── Modal de datos del cliente ────────────────────────────────

interface NotaVentaModalProps {
  sale: Sale | null;
  products: Product[];
  isDesktop: boolean;
  onClose: () => void;
}

export function NotaVentaModal({ sale, products, isDesktop, onClose }: NotaVentaModalProps) {
  const [customer, setCustomer] = useState<CustomerInfo>({
    nombre: '', dniCuit: '', razonSocial: '', empresa: '', direccion: '', cpCiudad: '',
  });

  if (!sale) return null;

  const set = (field: keyof CustomerInfo) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCustomer(c => ({ ...c, [field]: e.target.value }));

  const handleGenerar = () => {
    abrirNotaPDF(sale, products, customer);
    onClose();
  };

  const subtitle = `Venta #${String(sale.id).padStart(6, '0')} · ${fmtMoney(sale.total)}`;

  const body = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="field">
        <label className="field-label">Nombre</label>
        <input className="input" autoFocus placeholder="Nombre del cliente" value={customer.nombre} onChange={set('nombre')} />
      </div>
      <div className="field">
        <label className="field-label">DNI / CUIT / CUIL</label>
        <input className="input mono" placeholder="20-12345678-9" value={customer.dniCuit} onChange={set('dniCuit')} />
      </div>
      <div className="field">
        <label className="field-label">
          Razón social <span style={{ opacity: 0.5, fontSize: '0.85em' }}>(opcional)</span>
        </label>
        <input className="input" placeholder="Nombre legal de la empresa" value={customer.razonSocial} onChange={set('razonSocial')} />
      </div>
      <div className="field">
        <label className="field-label">
          Empresa <span style={{ opacity: 0.5, fontSize: '0.85em' }}>(opcional)</span>
        </label>
        <input className="input" placeholder="Nombre de la empresa" value={customer.empresa} onChange={set('empresa')} />
      </div>
      <div className="field">
        <label className="field-label">
          Dirección postal <span style={{ opacity: 0.5, fontSize: '0.85em' }}>(opcional)</span>
        </label>
        <input className="input" placeholder="Av. San Martín 123" value={customer.direccion} onChange={set('direccion')} />
      </div>
      <div className="field">
        <label className="field-label">
          CP — Ciudad (Provincia) <span style={{ opacity: 0.5, fontSize: '0.85em' }}>(opcional)</span>
        </label>
        <input className="input" placeholder="8000 — Bahía Blanca (Buenos Aires)" value={customer.cpCiudad} onChange={set('cpCiudad')} />
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <Modal
        open
        onClose={onClose}
        title="Nota de venta"
        subtitle={subtitle}
        footer={
          <>
            <button className="btn btn-sm" onClick={onClose}>Omitir</button>
            <button className="btn btn-primary btn-sm" onClick={handleGenerar}>
              Guardar PDF
            </button>
          </>
        }
      >
        {body}
      </Modal>
    );
  }

  return (
    <Sheet
      open
      full
      onClose={onClose}
      title="Nota de venta"
      subtitle={subtitle}
      footer={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" style={{ flex: 1 }} onClick={onClose}>Omitir</button>
          <button className="btn btn-primary btn-sm" style={{ flex: 2 }} onClick={handleGenerar}>
            Guardar PDF
          </button>
        </div>
      }
    >
      {body}
    </Sheet>
  );
}
