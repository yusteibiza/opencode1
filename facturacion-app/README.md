# Aplicación de Facturación

Sistema web de facturación con base de datos SQLite, Node.js/Express backend y React frontend.

## Características

- Gestión completa de clientes (CRUD)
- Gestión de productos (CRUD)
- Creación de facturas con múltiples items
- Cálculo automático de subtotal, IVA (16%) y total
- Exportación de facturas a PDF
- Interfaz moderna y responsiva

## Tecnologías

### Backend
- Node.js
- Express.js
- SQLite3
- CORS
- Body Parser

### Frontend
- React
- Vite
- Axios
- jsPDF

## Instalación

### Backend
```bash
cd backend
npm install
npm start
```
El servidor se ejecutará en `http://localhost:5000`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
La aplicación se abrirá en `http://localhost:5173`

## Estructura del Proyecto

```
facturacion-app/
├── backend/
│   ├── database.js       # Configuración de SQLite
│   ├── server.js         # Servidor Express
│   ├── package.json
│   └── routes/           # Rutas API
│       ├── clientes.js
│       ├── productos.js
│       └── facturas.js
└── frontend/
    ├── src/
    │   ├── components/   # Componentes React
    │   │   ├── Clientes.jsx
    │   │   ├── Productos.jsx
    │   │   └── Facturas.jsx
    │   ├── services/
    │   │   └── api.js    # Cliente HTTP
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    └── package.json
```

## API Endpoints

### Clientes
- `GET /api/clientes` - Listar todos los clientes
- `GET /api/clientes/:id` - Obtener cliente por ID
- `POST /api/clientes` - Crear nuevo cliente
- `PUT /api/clientes/:id` - Actualizar cliente
- `DELETE /api/clientes/:id` - Eliminar cliente

### Productos
- `GET /api/productos` - Listar todos los productos
- `GET /api/productos/:id` - Obtener producto por ID
- `POST /api/productos` - Crear nuevo producto
- `PUT /api/productos/:id` - Actualizar producto
- `DELETE /api/productos/:id` - Eliminar producto

### Facturas
- `GET /api/facturas` - Listar todas las facturas
- `GET /api/facturas/:id` - Obtener factura con items
- `POST /api/facturas` - Crear nueva factura
- `PUT /api/facturas/:id` - Actualizar factura
- `DELETE /api/facturas/:id` - Eliminar factura

## Base de Datos

La base de datos SQLite se crea automáticamente con las siguientes tablas:

- **clientes**: id, nombre, email, telefono, direccion
- **productos**: id, codigo, nombre, descripcion, precio, stock
- **facturas**: id, numero, cliente_id, fecha, subtotal, iva, total, estado
- **factura_items**: id, factura_id, producto_id, cantidad, precio_unitario, subtotal

## Uso

1. Iniciar el backend: `cd backend && npm start`
2. Iniciar el frontend: `cd frontend && npm run dev`
3. Abrir `http://localhost:5173` en el navegador
4. Navegar entre las secciones: Clientes, Productos, Facturas
5. Crear clientes y productos primero
6. Crear facturas seleccionando cliente y agregando productos

## Notas

- El IVA está configurado al 16%
- Cada factura puede tener múltiples items
- Los productos se pueden reutilizar en diferentes facturas
- Los PDFs se generan y descargan automáticamente
