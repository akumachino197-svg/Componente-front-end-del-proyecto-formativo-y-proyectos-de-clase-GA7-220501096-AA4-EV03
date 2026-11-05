import { useCallback, useEffect, useState } from 'react';
import { ArrowDownUp, Plus } from 'lucide-react';
import { api } from '../api.js';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Modal from '../components/Modal.jsx';
import MovementForm from '../components/MovementForm.jsx';
import { formatDate } from '../utils/format.js';

export default function MovementsPage({ notify }) {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [movementRows, productRows] = await Promise.all([api.movements(), api.products()]);
      setMovements(movementRows);
      setProducts(productRows);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(); }, []);

  async function saveMovement(data) {
    try {
      await api.createMovement(data);
      setShowForm(false);
      notify('Movimiento registrado y existencias actualizadas.');
      await load();
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading products-heading">
          <div><h2>Historial de movimientos</h2><p>Se muestran los últimos 100 movimientos registrados.</p></div>
          <button className="button button-primary" onClick={() => setShowForm(true)} disabled={products.length === 0}><Plus size={18} /> Nuevo movimiento</button>
        </div>
        {products.length === 0 && !loading && <div className="inline-notice"><ArrowDownUp size={18} /><span>Registra un producto para habilitar los movimientos.</span></div>}
        {loading ? <LoadingState label="Cargando movimientos…" /> : movements.length === 0 ? (
          <EmptyState title="Aún no hay movimientos" message="Registra entradas de mercancía o salidas para ver el historial." />
        ) : (
          <div className="table-scroll">
            <table className="data-table movement-table">
              <thead><tr><th>Tipo</th><th>Producto</th><th>Código</th><th>Cantidad</th><th>Fecha</th><th>Observaciones</th></tr></thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td><span className={`movement-type-pill movement-${movement.type}`}>{movement.type === 'entrada' ? 'Entrada' : 'Salida'}</span></td>
                    <td><strong>{movement.productName}</strong></td>
                    <td>{movement.sku}</td>
                    <td><strong className={`movement-quantity movement-${movement.type}`}>{movement.type === 'entrada' ? '+' : '−'}{movement.quantity}</strong></td>
                    <td>{formatDate(movement.createdAt)}</td>
                    <td className="muted-cell">{movement.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {showForm && <Modal title="Registrar movimiento" onClose={() => setShowForm(false)}>
        <MovementForm products={products} onSave={saveMovement} onCancel={() => setShowForm(false)} />
      </Modal>}
    </div>
  );
}
