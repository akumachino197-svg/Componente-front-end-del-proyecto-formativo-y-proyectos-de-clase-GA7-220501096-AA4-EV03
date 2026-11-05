import { useCallback, useEffect, useState } from 'react';
import { Edit2, Plus, Tags, Trash2 } from 'lucide-react';
import { api } from '../api.js';
import EmptyState from '../components/EmptyState.jsx';
import LoadingState from '../components/LoadingState.jsx';
import Modal from '../components/Modal.jsx';

function CategoryForm({ category, onSave, onCancel }) {
  const [name, setName] = useState(category?.name ?? '');
  const [description, setDescription] = useState(category?.description ?? '');
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave({ name, description });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-grid single-column" onSubmit={submit}>
      <div className="field"><label htmlFor="category-name">Nombre <span>*</span></label><input id="category-name" required maxLength="80" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ej. Papelería" /></div>
      <div className="field"><label htmlFor="category-description">Descripción</label><textarea id="category-description" rows="3" maxLength="240" value={description} onChange={(event) => setDescription(event.target.value)} /></div>
      <div className="form-actions"><button className="button button-primary" disabled={saving}>{saving ? 'Guardando…' : category ? 'Guardar cambios' : 'Crear categoría'}</button><button type="button" className="button button-secondary" onClick={onCancel}>Cancelar</button></div>
    </form>
  );
}

export default function CategoriesPage({ notify }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setCategories(await api.categories());
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => { load(); }, []);

  async function saveCategory(data) {
    try {
      if (editing?.id) await api.updateCategory(editing.id, data);
      else await api.createCategory(data);
      setEditing(null);
      notify(editing?.id ? 'Categoría actualizada.' : 'Categoría creada.');
      await load();
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  async function removeCategory(category) {
    if (!window.confirm(`¿Eliminar la categoría "${category.name}"?`)) return;
    try {
      await api.deleteCategory(category.id);
      notify('Categoría eliminada.');
      await load();
    } catch (error) {
      notify(error.message, 'error');
    }
  }

  return (
    <div className="page-stack">
      <section className="panel">
        <div className="panel-heading products-heading">
          <div><h2>Categorías del inventario</h2><p>Clasifica los productos para mantener el catálogo organizado.</p></div>
          <button className="button button-primary" onClick={() => setEditing({})}><Plus size={18} /> Nueva categoría</button>
        </div>
        {loading ? <LoadingState label="Cargando categorías…" /> : categories.length === 0 ? (
          <EmptyState title="Aún no hay categorías" message="Crea una categoría para organizar y registrar tus productos." />
        ) : (
          <div className="category-grid">
            {categories.map((category) => (
              <article className="category-card" key={category.id}>
                <div className="category-card-icon"><Tags size={20} /></div>
                <div className="category-card-actions">
                  <button className="icon-button" title={`Editar ${category.name}`} aria-label={`Editar ${category.name}`} onClick={() => setEditing(category)}><Edit2 size={16} /></button>
                  <button className="icon-button icon-danger" title={`Eliminar ${category.name}`} aria-label={`Eliminar ${category.name}`} onClick={() => removeCategory(category)}><Trash2 size={16} /></button>
                </div>
                <h3>{category.name}</h3>
                <p>{category.description || 'Sin descripción.'}</p>
                <span className="category-count">{category.productCount} {category.productCount === 1 ? 'producto' : 'productos'}</span>
              </article>
            ))}
          </div>
        )}
      </section>
      {editing && <Modal title={editing.id ? 'Editar categoría' : 'Nueva categoría'} onClose={() => setEditing(null)}>
        <CategoryForm category={editing.id ? editing : null} onSave={saveCategory} onCancel={() => setEditing(null)} />
      </Modal>}
    </div>
  );
}
