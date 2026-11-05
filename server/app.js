import express from 'express';
import { createDatabase } from './db.js';
import { createInventory, InventoryError } from './inventory.js';

export function createApp({ db = createDatabase(), webRoot } = {}) {
  const app = express();
  const inventory = createInventory(db);

  app.use(express.json({ limit: '32kb' }));
  app.get('/api/health', (_request, response) => response.json({ status: 'ok' }));
  app.get('/api/dashboard', (_request, response) => response.json(inventory.dashboard()));
  app.get('/api/categories', (_request, response) => response.json(inventory.listCategories()));
  app.post('/api/categories', (request, response) => response.status(201).json(inventory.createCategory(request.body)));
  app.put('/api/categories/:id', (request, response) => response.json(inventory.updateCategory(request.params.id, request.body)));
  app.delete('/api/categories/:id', (request, response) => {
    inventory.deleteCategory(request.params.id);
    response.status(204).end();
  });
  app.get('/api/products', (request, response) => response.json(inventory.listProducts(request.query.search)));
  app.post('/api/products', (request, response) => response.status(201).json(inventory.createProduct(request.body)));
  app.put('/api/products/:id', (request, response) => response.json(inventory.updateProduct(request.params.id, request.body)));
  app.delete('/api/products/:id', (request, response) => {
    inventory.deleteProduct(request.params.id);
    response.status(204).end();
  });
  app.get('/api/movements', (_request, response) => response.json(inventory.listMovements()));
  app.post('/api/movements', (request, response) => response.status(201).json(inventory.createMovement(request.body)));

  if (webRoot) {
    app.use(express.static(webRoot));
    app.get('*splat', (_request, response) => response.sendFile('index.html', { root: webRoot }));
  }

  app.use((error, _request, response, _next) => {
    if (error instanceof InventoryError) {
      return response.status(error.status).json({ error: error.message });
    }
    if (error instanceof SyntaxError && 'body' in error) {
      return response.status(400).json({ error: 'El cuerpo de la solicitud no contiene JSON válido.' });
    }
    if (error.type === 'entity.too.large') {
      return response.status(413).json({ error: 'El cuerpo de la solicitud supera el tamaño permitido.' });
    }
    console.error('Error procesando la solicitud:', error);
    return response.status(500).json({ error: 'Ocurrió un error interno. Intenta nuevamente.' });
  });

  return { app, db };
}
