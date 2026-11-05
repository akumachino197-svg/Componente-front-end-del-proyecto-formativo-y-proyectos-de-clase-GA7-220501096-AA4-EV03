async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      ...options,
      headers: options.body ? { 'Content-Type': 'application/json', ...options.headers } : options.headers,
    });
  } catch {
    throw new Error('No fue posible conectar con el servidor. Verifica que la aplicación esté ejecutándose.');
  }

  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') ?? '';
  const result = contentType.includes('application/json') ? await response.json() : null;
  if (!response.ok) {
    throw new Error(result?.error ?? `La solicitud falló (${response.status}).`);
  }
  return result;
}

function jsonBody(value) {
  return { body: JSON.stringify(value) };
}

export const api = {
  dashboard: () => request('/dashboard'),
  categories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', ...jsonBody(data) }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', ...jsonBody(data) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
  products: (search = '') => request(`/products${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  createProduct: (data) => request('/products', { method: 'POST', ...jsonBody(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', ...jsonBody(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  movements: () => request('/movements'),
  createMovement: (data) => request('/movements', { method: 'POST', ...jsonBody(data) }),
};
