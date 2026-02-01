# Aplicación de Facturación

Sistema web de facturación con base de datos SQLite, Node.js/Express backend y React frontend.

## Características

- Gestión completa de clientes (CRUD)
- Gestión de productos (CRUD)
- Creación de facturas con múltiples items
- Cálculo automático de subtotal, IVA (21%) y total
- Exportación de facturas a PDF
- Interfaz moderna y responsiva
- Control automático de stock

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

## Instalación Rápida (Un Solo Servidor)

### Opción 1: Instalación completa automática
```bash
npm run setup
```
Este comando instala todas las dependencias, compila el frontend e inicia el servidor.

### Opción 2: Paso a paso

1. **Instalar todas las dependencias:**
```bash
npm run install:all
```

2. **Compilar el frontend:**
```bash
npm run build
```

3. **Iniciar el servidor:**
```bash
npm start
```

La aplicación estará disponible en `http://localhost:5000`

## Desarrollo

Si estás desarrollando y quieres ver los cambios en tiempo real:

```bash
# Terminal 1 - Backend
npm start

# Terminal 2 - Frontend (en modo desarrollo)
npm run dev
```

Con esto:
- Backend: `http://localhost:5000`
- Frontend (dev): `http://localhost:5173`

## Estructura del Proyecto

```
facturacion-app/
├── backend/
│   ├── database.js       # Configuración de SQLite
│   ├── server.js         # Servidor Express
│   ├── package.json
│   ├── public/           # Frontend compilado (generado automáticamente)
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
    ├── package.json
    └── vite.config.js
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

1. Abrir `http://localhost:5000` en el navegador
2. Navegar entre las secciones: Clientes, Productos, Facturas
3. Crear clientes y productos primero
4. Crear facturas seleccionando cliente y agregando productos

## Notas

- El IVA está configurado al 21%
- Cada factura puede tener múltiples items
- Los productos se pueden reutilizar en diferentes facturas
- El stock se decrementa automáticamente al crear facturas
- Si no hay stock suficiente, la factura no se creará
- Los PDFs se generan y descargan automáticamente
- Para producción, ejecuta `npm run build` antes de `npm start`