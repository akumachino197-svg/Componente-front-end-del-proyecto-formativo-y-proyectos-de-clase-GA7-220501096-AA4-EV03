import { Menu } from 'lucide-react';

const titles = {
  dashboard: ['Resumen general', 'Consulta el estado actual de tu inventario.'],
  products: ['Productos', 'Administra tu catálogo y niveles de existencias.'],
  categories: ['Categorías', 'Organiza y consulta las categorías de productos.'],
  movements: ['Movimientos', 'Registra y consulta entradas y salidas de inventario.'],
};

export default function Header({ page, onMenuOpen }) {
  const [title, subtitle] = titles[page];
  return (
    <header className="topbar">
      <button className="icon-button menu-button" aria-label="Abrir menú" onClick={onMenuOpen}><Menu size={21} /></button>
      <div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="topbar-avatar" aria-label="Sistema de inventario">I</div>
    </header>
  );
}
