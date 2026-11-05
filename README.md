# Sistema de Gestión de Inventario

Evidencia SENA **GA7-220501096-AA4-EV03 — Componente front-end del proyecto formativo y proyectos de clase**.

Aplicación web para administrar productos, categorías y movimientos de inventario. La interfaz React consume una API propia en Express; el backend persiste la información en SQLite. El sistema inicia sin registros de demostración: los indicadores y alertas se calculan con los datos que la persona registra.

## Requisitos

- Node.js 20.19 o superior.
- npm 10 o superior.
- Git (opcional, para consultar la historia del proyecto).

Comprueba las herramientas desde PowerShell:

```powershell
node --version
npm.cmd --version
```

## Instalación y ejecución local

Desde esta carpeta:

```powershell
npm.cmd install
npm.cmd run dev
```

Abre <http://127.0.0.1:5173>. Vite sirve React y reenvía las peticiones `/api` al servidor Express en `http://127.0.0.1:3000`. Detén ambos procesos con `Ctrl+C`.

La primera ejecución crea `data/inventario.sqlite` automáticamente. No se requieren credenciales de base de datos. El archivo local guarda las categorías, productos y movimientos entre reinicios y no se incluye en el repositorio ni en el ZIP.

Para compilar y ejecutar como una sola aplicación:

```powershell
npm.cmd run build
npm.cmd start
```

Luego abre <http://127.0.0.1:3000>. Para cambiar el puerto o la ubicación de la base de datos, define `PORT` o `DATABASE_PATH` antes de iniciar el servidor.

## Funcionalidades

- **Resumen:** productos y categorías registrados, unidades disponibles, productos en stock mínimo o por debajo, valor estimado del inventario y movimientos recientes.
- **Productos:** crear, consultar, buscar por nombre/código/categoría, filtrar por categoría o nivel de stock, ordenar por nombre/stock/precio, actualizar y eliminar. Los productos con historial no se pueden borrar; el stock de esos productos solo se modifica mediante movimientos.
- **Categorías:** crear, consultar, editar y eliminar. Una categoría con productos asociados no se puede borrar.
- **Movimientos:** registrar entradas y salidas, consultar las últimas 100 operaciones y mostrar cantidad, fecha y observaciones. Una transacción atómica actualiza las existencias; se rechazan salidas superiores al stock disponible.
- **Experiencia de uso:** diseño adaptable, estados de carga y vacío, validación de formularios, confirmación para eliminar y mensajes de éxito o error.

## Estructura

```text
src/
  components/   Componentes reutilizables (navegación, formularios, diálogos)
  pages/        Resumen, productos, categorías y movimientos
  utils/        Formateo de moneda y fechas
  api.js        Cliente HTTP para la API
  styles.css    Estilos globales y diseño responsive
server/
  app.js        Rutas y manejo de errores HTTP
  db.js         Esquema y conexión SQLite
  inventory.js  Validaciones y reglas del inventario
  inventory.test.js  Pruebas de API e integración con base temporal
```

## API

Todas las respuestas de error usan JSON con una propiedad `error`. Endpoints principales:

| Método | Ruta | Uso |
|---|---|---|
| GET | `/api/health` | Estado del servidor |
| GET | `/api/dashboard` | Indicadores, alertas y movimientos recientes |
| GET, POST | `/api/products` | Consultar (permite `?search=`) y crear productos |
| PUT, DELETE | `/api/products/:id` | Actualizar o eliminar producto |
| GET, POST | `/api/categories` | Consultar y crear categorías |
| PUT, DELETE | `/api/categories/:id` | Actualizar o eliminar categoría |
| GET, POST | `/api/movements` | Consultar historial y registrar movimiento |

## Pruebas

```powershell
npm.cmd test
npm.cmd run build
```

Las pruebas automatizadas usan una base de datos temporal e incluyen creación de registros, cálculo de indicadores reales, movimientos atómicos, rechazo de stock negativo, SKU duplicado, restricciones de categoría y validaciones. El plan para validaciones manuales de interfaz está en [`docs/pruebas.md`](docs/pruebas.md).

## Repositorio

<https://github.com/akumachino197-svg/Componente-front-end-del-proyecto-formativo-y-proyectos-de-clase-GA7-220501096-AA4-EV03>

Este repositorio contiene únicamente la evidencia del sistema de inventario y es independiente de la aplicación anterior de gestión de empleados.
