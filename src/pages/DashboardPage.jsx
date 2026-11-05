import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowDownUp, Boxes, CircleDollarSign, Package, Tags } from 'lucide-react';
import { api } from '../api.js';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import StatCard from '../components/StatCard.jsx';
import { formatCurrency, formatDate } from '../utils/format.js';

export default function DashboardPage({ notify }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard()
      .then(setData)
      .catch((error) => notify(error.message, 'error'))
      .finally(() => setLoading(false));
  }, [notify]);

  if (loading) return <LoadingState />;
  if (!data) return <EmptyState title="No se pudo cargar el resumen" message="Verifica la conexión con el servidor e inténtalo nuevamente." />;

  return (
    <div className="page-stack">
      <section className="stats-grid" aria-label="Indicadores del inventario">
        <StatCard title="Productos" value={data.productCount} detail="Productos registrados" icon={Package} />
        <StatCard title="Categorías" value={data.categoryCount} detail="Categorías creadas" icon={Tags} tone="violet" />
        <StatCard title="Unidades disponibles" value={data.totalUnits.toLocaleString('es-CO')} detail="Existencias actuales" icon={Boxes} tone="green" />
        <StatCard title="Stock bajo" value={data.lowStockCount} detail="Productos en su mínimo o menos" icon={AlertTriangle} tone="amber" />
      </section>

      <section className="inventory-value">
        <span className="value-icon"><CircleDollarSign size={21} /></span>
        <div><span>Valor estimado del inventario</span><strong>{formatCurrency(data.inventoryValue)}</strong></div>
        <span className="value-note">Calculado con precios unitarios y existencias registradas</span>
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-heading">
            <div><h2>Alertas de existencias</h2><p>Productos en el nivel mínimo o por debajo</p></div>
            <span className={`count-pill${data.lowStockCount ? ' count-warning' : ''}`}>{data.lowStockCount}</span>
          </div>
          {data.lowStock.length === 0 ? (
            <EmptyState title="Sin alertas de stock" message="Los productos con existencias bajas aparecerán aquí." />
          ) : (
            <div className="compact-list">
              {data.lowStock.map((product) => (
                <div className="compact-row" key={product.id}>
                  <span className="product-initial">{product.name.slice(0, 1).toUpperCase()}</span>
                  <div className="compact-main"><strong>{product.name}</strong><span>{product.sku} · {product.category}</span></div>
                  <span className="stock-warning">{product.stock} <small>/ mín. {product.minStock}</small></span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div><h2>Movimientos recientes</h2><p>Últimos registros de entrada y salida</p></div>
            <ArrowDownUp size={19} className="panel-heading-icon" />
          </div>
          {data.recentMovements.length === 0 ? (
            <EmptyState title="Aún no hay movimientos" message="Cuando registres una entrada o salida, aparecerá aquí." />
          ) : (
            <div className="compact-list">
              {data.recentMovements.map((movement) => (
                <div className="compact-row" key={movement.id}>
                  <span className={`movement-mark movement-${movement.type}`}>{movement.type === 'entrada' ? '+' : '−'}</span>
                  <div className="compact-main"><strong>{movement.productName}</strong><span>{formatDate(movement.createdAt)}</span></div>
                  <span className={`movement-quantity movement-${movement.type}`}>{movement.type === 'entrada' ? '+' : '−'}{movement.quantity}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
