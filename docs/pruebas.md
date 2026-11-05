# Plan de pruebas — GA7-220501096-AA4-EV03

## Pruebas automatizadas

Ejecuta `npm.cmd test` desde la carpeta de la evidencia. La suite crea una base SQLite temporal por escenario y verifica:

- Creación de categorías y productos, e indicadores de dashboard calculados a partir de esos registros.
- Transacción de salida: rechaza cantidades mayores al stock sin alterar las existencias.
- Transacción de entrada: aumenta el stock y agrega el movimiento al historial.
- Rechazo de códigos de producto duplicados.
- Protección contra borrar categorías con productos relacionados.
- Validación de campos obligatorios y cantidades negativas.

Ejecuta `npm.cmd run build` para comprobar la compilación de React.

## Validación funcional manual

Con `npm.cmd run dev`, abre `http://127.0.0.1:5173` y realiza estos casos:

| Caso | Acción | Resultado esperado |
|---|---|---|
| Inicial | Abrir el resumen en una base vacía | Los indicadores muestran cero y los paneles presentan estados vacíos, sin cifras de demostración. |
| Categoría | Crear, editar y eliminar una categoría vacía | Los cambios se guardan y la lista refleja el resultado. |
| Relación | Crear una categoría y asociarle un producto | La categoría muestra el producto asociado. |
| Producto | Registrar un producto con SKU, precio, existencias y nivel mínimo | Aparece en el catálogo y los indicadores se recalculan. |
| Búsqueda y filtros | Buscar por nombre/SKU/categoría, filtrar por categoría o stock y ordenar por nombre/stock/precio | La lista muestra coincidencias en el orden seleccionado; combinaciones sin resultados presentan un estado vacío. |
| Bajo stock | Registrar o modificar un producto con stock igual o menor al mínimo | Aparece la alerta y cambia el contador de stock bajo. |
| Movimiento entrada | Registrar entrada de unidades | La operación confirmada aparece en el historial y aumenta el stock. |
| Movimiento salida | Registrar una salida que no supere existencias | La operación aparece y disminuye el stock. |
| Salida inválida | Intentar retirar más unidades que las disponibles | Se muestra un error y el stock permanece intacto. |
| Integridad | Intentar eliminar una categoría con productos o un producto con historial | La operación se rechaza con un mensaje; no se pierde el historial. |
| Persistencia | Detener y reiniciar la aplicación | Los datos continúan disponibles en SQLite. |
| Responsive | Revisar escritorio y ventana móvil/tableta | La navegación, tablas y formularios se adaptan al ancho disponible. |

Registra capturas o resultados de las pruebas manuales solo después de ejecutarlas en el entorno de presentación.
