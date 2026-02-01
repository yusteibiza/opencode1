const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

initDB();

// API Routes - IMPORTANT: These must come BEFORE static file serving
try {
    const clientesRouter = require('./routes/clientes');
    const productosRouter = require('./routes/productos');
    const facturasRouter = require('./routes/facturas');

    app.use('/api/clientes', clientesRouter);
    app.use('/api/productos', productosRouter);
    app.use('/api/facturas', facturasRouter);
    console.log('✅ Rutas API cargadas correctamente');
} catch (err) {
    console.error('❌ Error cargando rutas:', err.message);
    console.error(err.stack);
}

// Log todas las rutas registradas para debug
console.log('🔧 Rutas API registradas:');
if (app._router && app._router.stack) {
    app._router.stack.forEach(function(r){
        if (r.route && r.route.path){
            console.log(`  ${Object.keys(r.route.methods).join(',').toUpperCase()} ${r.route.path}`);
        } else if (r.name === 'router') {
            console.log(`  Router: ${r.regexp}`);
        }
    });
} else {
    console.log('  No hay rutas registradas aún');
}

// API health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server is running' });
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'public')));

// Handle React routing, return all requests to React app
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} in your browser`);
    console.log(`🔧 API endpoints available at http://localhost:${PORT}/api`);
});