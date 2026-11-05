const PRODUCT_SELECT = `
  SELECT p.id, p.sku, p.name, p.description, p.category_id AS categoryId,
         c.name AS category, p.unit_price AS unitPrice, p.stock,
         p.min_stock AS minStock, p.created_at AS createdAt
  FROM products p
  JOIN categories c ON c.id = p.category_id
`;

function requiredText(value, label, maxLength) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new InventoryError(`${label} es obligatorio.`, 400);
  }
  const result = value.trim();
  if (result.length > maxLength) {
    throw new InventoryError(`${label} no puede superar ${maxLength} caracteres.`, 400);
  }
  return result;
}

function integer(value, label, { minimum = 0 } = {}) {
  if ((typeof value !== 'number' && typeof value !== 'string')
      || (typeof value === 'string' && value.trim() === '')) {
    throw new InventoryError(`${label} debe ser un número entero mayor o igual a ${minimum}.`, 400);
  }
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < minimum) {
    throw new InventoryError(`${label} debe ser un número entero mayor o igual a ${minimum}.`, 400);
  }
  return result;
}

function positiveId(value, label = 'Identificador') {
  return integer(Number(value), label, { minimum: 1 });
}

function unitPrice(value) {
  if ((typeof value !== 'number' && typeof value !== 'string')
      || (typeof value === 'string' && value.trim() === '')) {
    throw new InventoryError('El precio debe ser un número entre 0 y 999999999.', 400);
  }
  const result = Number(value);
  if (!Number.isFinite(result) || result < 0 || result > 999999999) {
    throw new InventoryError('El precio debe ser un número entre 0 y 999999999.', 400);
  }
  return Math.round(result * 100) / 100;
}

function objectBody(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InventoryError('El cuerpo de la solicitud debe ser un objeto JSON.', 400);
  }
  return value;
}

function duplicateError(error, message) {
  if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    throw new InventoryError(message, 409);
  }
  if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
    throw new InventoryError('La categoría o el producto seleccionado ya no existe.', 409);
  }
  throw error;
}

export class InventoryError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'InventoryError';
    this.status = status;
  }
}

export function createInventory(db) {
  const getProduct = db.prepare(`${PRODUCT_SELECT} WHERE p.id = ?`);

  function categoryInput(body) {
    body = objectBody(body);
    return {
      name: requiredText(body.name, 'El nombre de la categoría', 80),
      description: typeof body.description === 'string' ? body.description.trim().slice(0, 240) : '',
    };
  }

  function productInput(body) {
    body = objectBody(body);
    return {
      sku: requiredText(body.sku, 'El código', 40),
      name: requiredText(body.name, 'El nombre', 120),
      description: typeof body.description === 'string' ? body.description.trim().slice(0, 500) : '',
      categoryId: positiveId(body.categoryId, 'La categoría'),
      unitPrice: unitPrice(body.unitPrice),
      stock: integer(body.stock, 'Las existencias'),
      minStock: integer(body.minStock, 'El stock mínimo'),
    };
  }

  return {
    listCategories() {
      return db.prepare(`
        SELECT c.id, c.name, c.description, c.created_at AS createdAt,
               COUNT(p.id) AS productCount
        FROM categories c
        LEFT JOIN products p ON p.category_id = c.id
        GROUP BY c.id
        ORDER BY c.name COLLATE NOCASE
      `).all();
    },

    createCategory(body) {
      const input = categoryInput(body);
      try {
        const result = db.prepare(
          'INSERT INTO categories (name, description) VALUES (@name, @description)',
        ).run(input);
        return db.prepare('SELECT id, name, description FROM categories WHERE id = ?').get(result.lastInsertRowid);
      } catch (error) {
        duplicateError(error, 'Ya existe una categoría con ese nombre.');
      }
    },

    updateCategory(idValue, body) {
      const id = positiveId(idValue);
      const input = categoryInput(body);
      const result = db.prepare(
        'UPDATE categories SET name = @name, description = @description WHERE id = @id',
      ).run({ ...input, id });
      if (result.changes === 0) throw new InventoryError('La categoría no existe.', 404);
      return { id, ...input };
    },

    deleteCategory(idValue) {
      const id = positiveId(idValue);
      const productCount = db.prepare('SELECT COUNT(*) AS count FROM products WHERE category_id = ?').get(id).count;
      if (productCount > 0) {
        throw new InventoryError('No se puede eliminar una categoría que tiene productos asociados.', 409);
      }
      const result = db.prepare('DELETE FROM categories WHERE id = ?').run(id);
      if (result.changes === 0) throw new InventoryError('La categoría no existe.', 404);
    },

    listProducts(search = '') {
      const term = String(search).trim();
      const query = term
        ? `${PRODUCT_SELECT}
           WHERE p.name LIKE @term OR p.sku LIKE @term OR c.name LIKE @term
           ORDER BY p.name COLLATE NOCASE`
        : `${PRODUCT_SELECT} ORDER BY p.name COLLATE NOCASE`;
      return term ? db.prepare(query).all({ term: `%${term}%` }) : db.prepare(query).all();
    },

    createProduct(body) {
      const input = productInput(body);
      try {
        const result = db.prepare(`
          INSERT INTO products (sku, name, description, category_id, unit_price, stock, min_stock)
          VALUES (@sku, @name, @description, @categoryId, @unitPrice, @stock, @minStock)
        `).run(input);
        return getProduct.get(result.lastInsertRowid);
      } catch (error) {
        duplicateError(error, 'Ya existe un producto con ese código.');
      }
    },

    updateProduct(idValue, body) {
      const id = positiveId(idValue);
      const input = productInput(body);
      const current = db.prepare('SELECT stock FROM products WHERE id = ?').get(id);
      if (!current) throw new InventoryError('El producto no existe.', 404);
      const movementCount = db.prepare('SELECT COUNT(*) AS count FROM movements WHERE product_id = ?').get(id).count;
      if (movementCount > 0 && current.stock !== input.stock) {
        throw new InventoryError('Las existencias de un producto con movimientos se ajustan mediante una entrada o salida.', 409);
      }
      const result = db.prepare(`
        UPDATE products
        SET sku = @sku, name = @name, description = @description, category_id = @categoryId,
            unit_price = @unitPrice, stock = @stock, min_stock = @minStock, updated_at = datetime('now')
        WHERE id = @id
      `).run({ ...input, id });
      if (result.changes === 0) throw new InventoryError('El producto no existe.', 404);
      return getProduct.get(id);
    },

    deleteProduct(idValue) {
      const id = positiveId(idValue);
      const movementCount = db.prepare('SELECT COUNT(*) AS count FROM movements WHERE product_id = ?').get(id).count;
      if (movementCount > 0) {
        throw new InventoryError('No se puede eliminar un producto que tiene movimientos registrados.', 409);
      }
      const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);
      if (result.changes === 0) throw new InventoryError('El producto no existe.', 404);
    },

    listMovements() {
      return db.prepare(`
        SELECT m.id, m.type, m.quantity, m.notes, m.created_at AS createdAt,
               p.id AS productId, p.sku, p.name AS productName
        FROM movements m
        JOIN products p ON p.id = m.product_id
        ORDER BY m.id DESC
        LIMIT 100
      `).all();
    },

    createMovement(body) {
      body = objectBody(body);
      const productId = positiveId(body.productId, 'El producto');
      const quantity = integer(body.quantity, 'La cantidad', { minimum: 1 });
      if (quantity > 1000000000) throw new InventoryError('La cantidad supera el límite permitido.', 400);
      if (body.type !== 'entrada' && body.type !== 'salida') {
        throw new InventoryError('El tipo de movimiento debe ser entrada o salida.', 400);
      }
      const notes = typeof body.notes === 'string' ? body.notes.trim().slice(0, 240) : '';
      const applyMovement = db.transaction(() => {
        const product = db.prepare('SELECT id, stock FROM products WHERE id = ?').get(productId);
        if (!product) throw new InventoryError('El producto seleccionado no existe.', 404);
        const newStock = body.type === 'entrada' ? product.stock + quantity : product.stock - quantity;
        if (newStock < 0) throw new InventoryError('La salida supera las existencias disponibles.', 409);
        db.prepare('UPDATE products SET stock = ?, updated_at = datetime(\'now\') WHERE id = ?')
          .run(newStock, productId);
        const result = db.prepare(`
          INSERT INTO movements (product_id, type, quantity, notes) VALUES (?, ?, ?, ?)
        `).run(productId, body.type, quantity, notes);
        return db.prepare(`
          SELECT m.id, m.type, m.quantity, m.notes, m.created_at AS createdAt,
                 p.id AS productId, p.sku, p.name AS productName
          FROM movements m JOIN products p ON p.id = m.product_id WHERE m.id = ?
        `).get(result.lastInsertRowid);
      });
      return applyMovement();
    },

    dashboard() {
      const totals = db.prepare(`
        SELECT COUNT(*) AS productCount,
               COUNT(DISTINCT category_id) AS activeCategoryCount,
               COALESCE(SUM(stock), 0) AS totalUnits,
               COALESCE(SUM(stock * unit_price), 0) AS inventoryValue,
               COALESCE(SUM(CASE WHEN stock <= min_stock THEN 1 ELSE 0 END), 0) AS lowStockCount
        FROM products
      `).get();
      const categoryCount = db.prepare('SELECT COUNT(*) AS count FROM categories').get().count;
      const lowStock = db.prepare(`
        ${PRODUCT_SELECT}
        WHERE p.stock <= p.min_stock
        ORDER BY (p.stock - p.min_stock), p.name COLLATE NOCASE
        LIMIT 6
      `).all();
      const recentMovements = db.prepare(`
        SELECT m.id, m.type, m.quantity, m.created_at AS createdAt,
               p.sku, p.name AS productName
        FROM movements m JOIN products p ON p.id = m.product_id
        ORDER BY m.id DESC LIMIT 5
      `).all();
      return { ...totals, categoryCount, lowStock, recentMovements };
    },
  };
}
