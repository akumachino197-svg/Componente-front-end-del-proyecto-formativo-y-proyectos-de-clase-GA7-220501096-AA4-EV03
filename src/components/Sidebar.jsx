import {
  ArrowDownUp, Boxes, ChartNoAxesCombined, Package, Tags, X,
} from 'lucide-react';

const links = [
  { id: 'dashboard', label: 'Resumen', icon: ChartNoAxesCombined },
  { id: 'products', label: 'Productos', icon: Package },
  { id: 'categories', label: 'Categorías', icon: Tags },
  { id: 'movements', label: 'Movimientos', icon: ArrowDownUp },
];

export default function Sidebar({ page, onNavigate, open, onClose }) {
  return (
    <>
      {open && <button className="sidebar-backdrop" aria-label="Cerrar menú" onClick={onClose} />}
      <aside className={`sidebar${open ? ' sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Boxes size={22} strokeWidth={2.2} /></div>
          <div><strong>Stockwise</strong><span>Control de inventario</span></div>
          <button className="icon-button sidebar-close" aria-label="Cerrar menú" onClick={onClose}><X size={20} /></button>
        </div>
        <span className="nav-caption">MENÚ PRINCIPAL</span>
        <nav className="main-nav" aria-label="Navegación principal">
          {links.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-link${page === id ? ' nav-link-active' : ''}`}
              aria-current={page === id ? 'page' : undefined}
              onClick={() => { onNavigate(id); onClose(); }}
            >
              <Icon size={19} strokeWidth={1.8} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="status-dot" />
          <span>Inventario local</span>
        </div>
      </aside>
    </>
  );
}
