import { useState } from 'react';

export default function MovementForm({ products, onSave, onCancel }) {
  const [form, setForm] = useState({ productId: '', type: 'entrada', quantity: '1', notes: '' });
  const [saving, setSaving] = useState(false);
  const selectedProduct = products.find((product) => String(product.id) === form.productId);
  const isExitTooLarge = form.type === 'salida'
    && selectedProduct
    && Number(form.quantity) > selectedProduct.stock;

  function update(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function submit(event) {
    event.preventDefault();
    if (isExitTooLarge) return;
    setSaving(true);
    try {
      await onSave({ ...form, productId: Number(form.productId), quantity: Number(form.quantity) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="form-grid single-column" onSubmit={submit}>
      <div className="field"><label htmlFor="movement-product">Producto <span>*</span></label>
        <select id="movement-product" name="productId" required value={form.productId} onChange={update}>
          <option value="">Selecciona un producto</option>
          {products.map((product) => <option value={product.id} key={product.id}>{product.name} · {product.sku} (stock: {product.stock})</option>)}
        </select>
      </div>
      <fieldset className="field movement-type-field"><legend>Tipo de movimiento <span>*</span></legend>
        <label className={`radio-card${form.type === 'entrada' ? ' radio-selected' : ''}`}><input type="radio" name="type" value="entrada" checked={form.type === 'entrada'} onChange={update} /><span className="radio-symbol entry-symbol">+</span><span><strong>Entrada</strong><small>Agregar existencias</small></span></label>
        <label className={`radio-card${form.type === 'salida' ? ' radio-selected' : ''}`}><input type="radio" name="type" value="salida" checked={form.type === 'salida'} onChange={update} /><span className="radio-symbol exit-symbol">−</span><span><strong>Salida</strong><small>Descontar existencias</small></span></label>
      </fieldset>
      <div className="field"><label htmlFor="movement-quantity">Cantidad <span>*</span></label><input id="movement-quantity" name="quantity" type="number" min="1" max="1000000000" step="1" required value={form.quantity} onChange={update} /></div>
      {isExitTooLarge && <p className="field-error field-full">La cantidad supera las existencias disponibles ({selectedProduct.stock}).</p>}
      <div className="field"><label htmlFor="movement-notes">Observaciones</label><textarea id="movement-notes" name="notes" rows="3" maxLength="240" value={form.notes} onChange={update} placeholder="Motivo u observación (opcional)" /></div>
      <div className="form-actions"><button className="button button-primary" disabled={saving || isExitTooLarge}>{saving ? 'Registrando…' : 'Registrar movimiento'}</button><button type="button" className="button button-secondary" onClick={onCancel}>Cancelar</button></div>
    </form>
  );
}
