import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const webRoot = resolve(projectRoot, 'dist');
const { app, db } = createApp({ webRoot });
const port = Number(process.env.PORT ?? 3000);
const server = app.listen(port, '127.0.0.1', () => {
  console.log(`Sistema de inventario disponible en http://127.0.0.1:${port}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
