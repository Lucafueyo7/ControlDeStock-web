'use client';
import { useState, useEffect } from 'react';
import type { Product, Sale, Route, DaySales } from '../lib/data';
import { ToastProvider } from './ui';
import {
  SearchIcon, PlusIcon, DashboardIcon, BoxIcon, CartIcon,
} from './icons';
import {
  DesktopDashboard, DesktopProducts, DesktopSales,
  DesktopNewSale, DesktopSaleDetail, DesktopProductDetail,
} from './DesktopScreens';
import {
  MobileDashboard, MobileProducts, MobileSales,
  MobileNewSale, MobileSaleDetail, MobileProductDetail,
} from './MobileScreens';
import { UserButton } from '@clerk/nextjs';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isDesktop;
}

function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return [theme, setTheme] as const;
}

interface StockAppProps {
  initialProducts: Product[];
  initialSales: Sale[];
  initialDailySales: DaySales[];
  userName: string;
  userEmail: string;
  userImageUrl?: string;
}

export default function StockApp(props: StockAppProps) {
  return (
    <ToastProvider>
      <App {...props} />
    </ToastProvider>
  );
}

function App({ initialProducts, initialSales, initialDailySales, userName, userEmail, userImageUrl }: StockAppProps) {
  const isDesktop = useIsDesktop();
  const [, setTheme] = useTheme();
  const [route, setRoute] = useState<Route>({ name: 'dashboard', param: null, extra: null });
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [sales, setSales] = useState<Sale[]>(initialSales);

  const goTo = (name: Route['name'], param?: number | null, extra?: Route['extra']) =>
    setRoute({ name, param: param ?? null, extra: extra ?? null });

  const shared = { products, setProducts, sales, setSales, onGoTo: goTo, dailySales: initialDailySales };

  return isDesktop
    ? <DesktopShell {...shared} route={route} setTheme={setTheme} userName={userName} userEmail={userEmail} userImageUrl={userImageUrl} />
    : <MobileShell {...shared} route={route} />;
}

// ── Desktop Shell ─────────────────────────────────────────────

const DESKTOP_NAV = [
  { id: 'dashboard' as const, label: 'Resumen',   Icon: DashboardIcon, kbd: '1' },
  { id: 'products'  as const, label: 'Productos', Icon: BoxIcon,       kbd: '2' },
  { id: 'sales'     as const, label: 'Ventas',    Icon: CartIcon,      kbd: '3' },
];

interface ShellProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  sales: Sale[];
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  route: Route;
  onGoTo: (name: Route['name'], param?: number | null, extra?: Route['extra']) => void;
  dailySales: DaySales[];
}

function DesktopShell({ products, setProducts, sales, setSales, route, onGoTo, setTheme, dailySales, userName, userEmail }: ShellProps & {
  setTheme: React.Dispatch<React.SetStateAction<'dark' | 'light'>>;
  userName: string;
  userEmail: string;
  userImageUrl?: string;
}) {
  const tabSection = route.name.startsWith('product') ? 'products' : route.name.startsWith('sale') ? 'sales' : route.name;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.key === '1') onGoTo('dashboard');
      if (e.key === '2') onGoTo('products');
      if (e.key === '3') onGoTo('sales');
      if (e.key.toLowerCase() === 'n') onGoTo('sales-new');
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onGoTo]);

  const crumbs = (() => {
    switch (route.name) {
      case 'dashboard': return [{ label: 'Resumen', here: true }];
      case 'products':  return [{ label: 'Productos', here: true }];
      case 'product-detail': {
        const p = products.find(p => p.id === route.param);
        return [
          { label: 'Productos', onClick: () => onGoTo('products') },
          { label: p?.nombre || 'Detalle', here: true },
        ];
      }
      case 'sales':      return [{ label: 'Ventas', here: true }];
      case 'sales-new':  return [{ label: 'Ventas', onClick: () => onGoTo('sales') }, { label: 'Nueva venta', here: true }];
      case 'sale-detail': return [{ label: 'Ventas', onClick: () => onGoTo('sales') }, { label: `#${route.param}`, here: true }];
      default: return [];
    }
  })();

  const renderScreen = () => {
    switch (route.name) {
      case 'dashboard':      return <DesktopDashboard products={products} sales={sales} onGoTo={onGoTo} dailySales={dailySales} />;
      case 'products':       return <DesktopProducts {...{ products, setProducts, sales, setSales, onGoTo }} />;
      case 'sales':          return <DesktopSales products={products} sales={sales} onGoTo={onGoTo} />;
      case 'sales-new':      return <DesktopNewSale {...{ products, setProducts, sales, setSales, onGoTo }} />;
      case 'sale-detail':    return <DesktopSaleDetail saleId={route.param ?? null} products={products} sales={sales} onGoTo={onGoTo} />;
      case 'product-detail': return <DesktopProductDetail productId={route.param ?? null} products={products} sales={sales} onGoTo={onGoTo} />;
    }
  };

  return (
    <div className="view-desktop">
      <div className="app">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-mark">S</div>
            <div>
              <div className="brand-name">Showroom Hogar</div>
              <div className="brand-sub">v2.4 · inventory</div>

            </div>
          </div>

          <div className="nav-label">Workspace</div>
          {DESKTOP_NAV.map(({ id, label, Icon, kbd }) => (
            <div key={id} className={`nav-item ${tabSection === id ? 'active' : ''}`} onClick={() => onGoTo(id)}>
              <Icon className="icon" />
              <span>{label}</span>
              <span className="kbd">{kbd}</span>
            </div>
          ))}

          <div className="nav-label">Acciones</div>
          <div className="nav-item" onClick={() => onGoTo('sales-new')}>
            <PlusIcon className="icon" />
            <span>Nueva venta</span>
            <span className="kbd">N</span>
          </div>

          <div className="sidebar-foot">
            <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', padding: '0 8px 4px', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{products.filter(p => p.activity).length} SKUs</span>
                <span>{sales.length} ventas</span>
              </div>
            </div>
            <div className="user-chip">
              <div className="avatar">
                <UserButton/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{userName}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{userEmail}</div>
              </div>
              <button
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-dim)', padding: '4px 6px', borderRadius: 4 }}
                title="Cambiar tema">
                ◐
              </button>
            </div>
          </div>
        </aside>

        <div className="main">
          <header className="topbar">
            <div className="crumbs">
              {crumbs.map((c, i) => (
                <span key={i} style={{ display: 'contents' }}>
                  {i > 0 && <span className="sep">/</span>}
                  <span className={c.here ? 'here' : ''} style={c.onClick ? { cursor: 'pointer' } : undefined} onClick={c.onClick}>{c.label}</span>
                </span>
              ))}
            </div>
            <div className="search-wrap">
              <SearchIcon className="search-icon" />
              <input className="search-input" placeholder="Buscar producto, venta, código…" />
              <span className="search-kbd">⌘K</span>
            </div>
          </header>
          {renderScreen()}
        </div>
      </div>
    </div>
  );
}

// ── Mobile Shell ──────────────────────────────────────────────

const MOBILE_TABS = [
  { id: 'dashboard' as const, label: 'Resumen',   Icon: DashboardIcon },
  { id: 'products'  as const, label: 'Productos', Icon: BoxIcon },
  { id: 'sales'     as const, label: 'Ventas',    Icon: CartIcon },
];

function MobileShell({ products, setProducts, sales, setSales, route, onGoTo, dailySales }: ShellProps) {
  const tabSection = route.name.startsWith('product') ? 'products' : route.name.startsWith('sale') ? 'sales' : route.name;
  const showTabBar = !['sales-new'].includes(route.name);

  const renderScreen = () => {
    switch (route.name) {
      case 'dashboard':      return <MobileDashboard products={products} sales={sales} onGoTo={onGoTo} dailySales={dailySales} />;
      case 'products':       return <MobileProducts products={products} setProducts={setProducts} sales={sales} onGoTo={onGoTo} initialFilter={route.extra?.filter} />;
      case 'sales':          return <MobileSales sales={sales} products={products} onGoTo={onGoTo} />;
      case 'sales-new':      return <MobileNewSale products={products} setProducts={setProducts} sales={sales} setSales={setSales} onGoTo={onGoTo} />;
      case 'sale-detail':    return <MobileSaleDetail saleId={route.param ?? null} sales={sales} products={products} onGoTo={onGoTo} />;
      case 'product-detail': return <MobileProductDetail productId={route.param ?? null} products={products} setProducts={setProducts} sales={sales} onGoTo={onGoTo} />;
    }
  };

  return (
    <div className="view-mobile">
      <div className="app" style={{ position: 'relative', height: '100dvh', overflow: 'hidden' }}>
        {renderScreen()}
        {showTabBar && (
          <nav className="tabbar">
            <div className="tabbar-inner">
              {MOBILE_TABS.map(({ id, label, Icon }) => (
                <button key={id} className={`tab ${tabSection === id ? 'active' : ''}`} onClick={() => onGoTo(id)}>
                  <Icon className="tab-icon" />
                  <span>{label}</span>
                </button>
              ))}
              <button className="tab fab" onClick={() => onGoTo('sales-new')}>
                <PlusIcon className="tab-icon" />
                <span>Vender</span>
              </button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
}
