import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Edit2, Plus, Search, Trash2 } from 'lucide-react';
import { api } from '../api.js';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Modal from '../components/Modal.jsx';
import ProductForm from '../components/ProductForm.jsx';
import { formatCurrency } from '../utils/format.js';

export default function ProductsPage({ notify }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const visibleProducts = products
    .filter((product) => !categoryFilter || String(product.categoryId) === categoryFilter)
    .filter((product) => stockFilter === 'all'
      || (stockFilter === 'low' ? product.stock <= product.minStock : product.stock > product.minStock))
    .sort((a, b) => {
      if (sortBy === 'stock') return a.stock - b.stock || a.name.localeCompare(b.name);
      if (sortBy === 'price') return a.unitPrice - b.unitPrice || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name, 'es');
    });

  const load = useCallback(async (term = search) => {
    setLoading(true);
    try {
      const [productRows, categoryRows] = await Promise.all([api.products(term), api.categories()]);
      setProducts(productRows);
      setCategories(categoryRows);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [notify, search]);

  useEffect(() => { load(''); }, []);

  async function saveProduct(data) {
    try {
      if (editing?.id) await api.updateProduct(editing.id, data);
      else await api.createProduct(data);
      setEditing(null);
      notify(editing?.id ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.');
      await load();
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  async function removeProduct(product) {
    if (!window.confirm(`¿Eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.deleteProduct(product.id);
      notify('Producto eliminado.');
      await load();
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  function searchProducts(event) {
    event.preventDefault();
    load(search);
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading products-heading">
          <div><h2>Catálogo de productos</h2><p>{visibleProducts.length} de {products.length} {products.length === 1 ? 'producto visible' : 'productos visibles'}</p></div>
          <button className="button button-primary" onClick={() => setEditing({})}><Plus size={18} /> Nuevo producto</button>
        </div>
        {categories.length === 0 && !loading && (
          <div className="inline-notice"><AlertTriangle size={18} /><span>Crea una categoría antes de registrar productos.</span></div>
        )}
        <div className="catalog-tools">
          <form className="search-bar" onSubmit={searchProducts}>
            <Search size={18} />
            <input aria-label="Buscar productos" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nombre, código o categoría…" />
            <button className="button button-secondary" type="submit">Buscar</button>
          </form>
          <select aria-label="Filtrar por categoría" className="tool-select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="">Todas las categorías</option>
            {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
          </select>
          <select aria-label="Filtrar por stock" className="tool-select" value={stockFilter} onChange={(event) => setStockFilter(event.target.value)}>
            <option value="all">Todo el stock</option>
            <option value="low">Stock bajo</option>
            <option value="available">Disponible</option>
          </select>
          <select aria-label="Ordenar productos" className="tool-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="name">Orden: nombre</option>
            <option value="stock">Orden: stock menor</option>
            <option value="price">Orden: precio menor</option>
          </select>
        </div>
        {loading ? <LoadingState label="Cargando productos…" /> : products.length === 0 ? (
          <EmptyState title={search ? 'No encontramos resultados' : 'Aún no hay productos'} message={search ? 'Prueba con otro nombre, código o categoría.' : 'Registra tu primer producto para comenzar a controlar las existencias.'} />
        ) : visibleProducts.length === 0 ? (
          <EmptyState title="No hay productos con esos filtros" message="Ajusta los filtros para ver otros productos." />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Existencias</th><th>Estado</th><th className="align-right">Acciones</th></tr></thead>
              <tbody>
                {visibleProducts.map((product) => {
                  const low = product.stock <= product.minStock;
                  return (
                    <tr key={product.id}>
                      <td><div className="table-product"><span className="product-initial">{product.name.slice(0, 1).toUpperCase()}</span><div><strong>{product.name}</strong><small>{product.sku}</small></div></div></td>
                      <td>{product.category}</td>
                      <td>{formatCurrency(product.unitPrice)}</td>
                      <td><strong>{product.stock}</strong><span className="muted-cell"> / mín. {product.minStock}</span></td>
                      <td><span className={`status-pill ${low ? 'status-low' : 'status-ok'}`}>{low ? 'Stock bajo' : 'Disponible'}</span></td>
                      <td><div className="row-actions">
                        <button className="icon-button" title={`Editar ${product.name}`} aria-label={`Editar ${product.name}`} onClick={() => setEditing(product)}><Edit2 size={17} /></button>
                        <button className="icon-button icon-danger" title={`Eliminar ${product.name}`} aria-label={`Eliminar ${product.name}`} onClick={() => removeProduct(product)}><Trash2 size={17} /></button>
                      </div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {editing && <Modal title={editing.id ? 'Editar producto' : 'Nuevo producto'} onClose={() => setEditing(null)}>
        {categories.length === 0 ? <EmptyState title="Primero agrega una categoría" message="El producto debe pertenecer a una categoría." /> : (
          <ProductForm product={editing.id ? editing : null} categories={categories} onSave={saveProduct} onCancel={() => setEditing(null)} />
        )}
      </Modal>}
    </div>
  );
}
