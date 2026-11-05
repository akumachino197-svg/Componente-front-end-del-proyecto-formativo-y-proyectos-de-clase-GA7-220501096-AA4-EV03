import { useState } from 'react';

const blankProduct = {
  sku: '', name: '', description: '', categoryId: '', unitPrice: '', stock: '', minStock: '0',
};

export default function ProductForm({ product, categories, onSave, onCancel }) {
  const [form, setForm] = useState(product ? {
    sku: product.sku,
    name: product.name,
    description: product.description,
    categoryId: String(product.categoryId),
    unitPrice: String(product.unitPrice),
    stock: String(product.stock),
    minStock: String(product.minStock),
  } : blankProduct);
  const [saving, setSaving] = useState(false);

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        categoryId: Number(form.categoryId),
        unitPrice: Number(form.unitPrice),
        stock: Number(form.stock),
        minStock: Number(form.minStock),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <div className="field"><label htmlFor="sku">Código / SKU <span>*</span></label><input id="sku" name="sku" required maxLength="40" value={form.sku} onChange={update} placeholder="Ej. TEC-001" /></div>
      <div className="field"><label htmlFor="name">Nombre del producto <span>*</span></label><input id="name" name="name" required maxLength="120" value={form.name} onChange={update} placeholder="Nombre descriptivo" /></div>
      <div className="field field-full"><label htmlFor="categoryId">Categoría <span>*</span></label>
        <select id="categoryId" name="categoryId" required value={form.categoryId} onChange={update}>
          <option value="">Selecciona una categoría</option>
          {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
        </select>
      </div>
      <div className="field"><label htmlFor="unitPrice">Precio unitario (COP) <span>*</span></label><input id="unitPrice" name="unitPrice" type="number" min="0" max="999999999" step="0.01" required value={form.unitPrice} onChange={update} /></div>
      <div className="field"><label htmlFor="stock">Existencias actuales <span>*</span></label><input id="stock" name="stock" type="number" min="0" step="1" required value={form.stock} onChange={update} /></div>
      <div className="field"><label htmlFor="minStock">Nivel mínimo de stock <span>*</span></label><input id="minStock" name="minStock" type="number" min="0" step="1" required value={form.minStock} onChange={update} /></div>
      <div className="field field-full"><label htmlFor="description">Descripción</label><textarea id="description" name="description" maxLength="500" rows="3" value={form.description} onChange={update} /></div>
      <div className="form-actions field-full">
        <button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : product ? 'Guardar cambios' : 'Crear producto'}</button>
        <button className="button button-secondary" type="button" onClick={onCancel}>Cancelar</button>
      </div>
    </form>
  );
}
