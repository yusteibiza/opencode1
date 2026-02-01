import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const clientesAPI = {
    getAll: () => api.get('/clientes'),
    getById: (id) => api.get(`/clientes/${id}`),
    create: (data) => api.post('/clientes', data),
    update: (id, data) => api.put(`/clientes/${id}`, data),
    delete: (id) => api.delete(`/clientes/${id}`),
};

export const productosAPI = {
    getAll: () => api.get('/productos'),
    getById: (id) => api.get(`/productos/${id}`),
    create: (data) => api.post('/productos', data),
    update: (id, data) => api.put(`/productos/${id}`, data),
    delete: (id) => api.delete(`/productos/${id}`),
};

export const facturasAPI = {
    getAll: () => api.get('/facturas'),
    getById: (id) => api.get(`/facturas/${id}`),
    create: (data) => api.post('/facturas', data),
    update: (id, data) => api.put(`/facturas/${id}`, data),
    delete: (id) => api.delete(`/facturas/${id}`),
};

export default api;
