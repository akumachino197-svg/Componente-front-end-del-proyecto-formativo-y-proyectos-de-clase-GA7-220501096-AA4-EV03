import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createApp } from './app.js';
import { createDatabase } from './db.js';

async function setup(t) {
  const directory = mkdtempSync(join(tmpdir(), 'inventario-test-'));
  const db = createDatabase(join(directory, 'test.sqlite'));
  const { app } = createApp({ db });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  t.after(() => {
    server.close();
    db.close();
    rmSync(directory, { recursive: true, force: true });
  });
  return `http://127.0.0.1:${address.port}/api`;
}

async function request(base, path, method = 'GET', body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: body === undefined ? {} : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = response.status === 204 ? null : await response.json();
  return { response, result };
}

test('creates categories and products and derives dashboard totals from persisted records', async (t) => {
  const base = await setup(t);
  const category = await request(base, '/categories', 'POST', { name: 'Papelería' });
  assert.equal(category.response.status, 201);

  const product = await request(base, '/products', 'POST', {
    sku: 'LAP-01', name: 'Lápiz', categoryId: category.result.id,
    unitPrice: 1.25, stock: 5, minStock: 5,
  });
  assert.equal(product.response.status, 201);
  assert.equal(product.result.stock, 5);

  const dashboard = await request(base, '/dashboard');
  assert.equal(dashboard.result.productCount, 1);
  assert.equal(dashboard.result.categoryCount, 1);
  assert.equal(dashboard.result.totalUnits, 5);
  assert.equal(dashboard.result.lowStockCount, 1);
  assert.equal(dashboard.result.lowStock[0].sku, 'LAP-01');
});

test('records stock movements atomically and rejects an overselling exit', async (t) => {
  const base = await setup(t);
  const category = await request(base, '/categories', 'POST', { name: 'Accesorios' });
  const product = await request(base, '/products', 'POST', {
    sku: 'MOU-01', name: 'Mouse', categoryId: category.result.id,
    unitPrice: 20, stock: 3, minStock: 1,
  });

  const exit = await request(base, '/movements', 'POST', {
    productId: product.result.id, type: 'salida', quantity: 4,
  });
  assert.equal(exit.response.status, 409);
  const afterRejectedExit = await request(base, '/products');
  assert.equal(afterRejectedExit.result[0].stock, 3);

  const entry = await request(base, '/movements', 'POST', {
    productId: product.result.id, type: 'entrada', quantity: 2, notes: 'Reposición',
  });
  assert.equal(entry.response.status, 201);
  const afterEntry = await request(base, '/products');
  assert.equal(afterEntry.result[0].stock, 5);
  assert.equal((await request(base, '/movements')).result.length, 1);
});

test('rejects duplicate SKUs and prevents deleting categories in use', async (t) => {
  const base = await setup(t);
  const category = await request(base, '/categories', 'POST', { name: 'Tecnología' });
  const input = {
    sku: 'TEC-01', name: 'Teclado', categoryId: category.result.id,
    unitPrice: 30, stock: 2, minStock: 1,
  };
  await request(base, '/products', 'POST', input);
  const duplicate = await request(base, '/products', 'POST', { ...input, name: 'Otro' });
  assert.equal(duplicate.response.status, 409);
  const deletedCategory = await request(base, `/categories/${category.result.id}`, 'DELETE');
  assert.equal(deletedCategory.response.status, 409);
});

test('validates required fields and stock thresholds', async (t) => {
  const base = await setup(t);
  const invalidCategory = await request(base, '/categories', 'POST', { name: '  ' });
  assert.equal(invalidCategory.response.status, 400);
  const category = await request(base, '/categories', 'POST', { name: 'Hogar' });
  const invalidProduct = await request(base, '/products', 'POST', {
    sku: 'HOG-01', name: 'Silla', categoryId: category.result.id,
    unitPrice: 10, stock: -1, minStock: 1,
  });
  assert.equal(invalidProduct.response.status, 400);
  const invalidBody = await request(base, '/categories', 'POST', null);
  assert.equal(invalidBody.response.status, 400);
});

test('preserves movement history and requires stock changes to use movements', async (t) => {
  const base = await setup(t);
  const category = await request(base, '/categories', 'POST', { name: 'Audio' });
  const product = await request(base, '/products', 'POST', {
    sku: 'AUD-01', name: 'Audífonos', categoryId: category.result.id,
    unitPrice: 40, stock: 4, minStock: 1,
  });
  await request(base, '/movements', 'POST', {
    productId: product.result.id, type: 'entrada', quantity: 1,
  });

  const invalidAdjustment = await request(base, `/products/${product.result.id}`, 'PUT', {
    ...product.result, stock: 0,
  });
  assert.equal(invalidAdjustment.response.status, 409);

  const deleteProduct = await request(base, `/products/${product.result.id}`, 'DELETE');
  assert.equal(deleteProduct.response.status, 409);

  const currentProduct = await request(base, '/products');
  assert.equal(currentProduct.result[0].stock, 5);
  assert.equal((await request(base, '/movements')).result.length, 1);
});
