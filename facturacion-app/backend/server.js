const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { initDB } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

initDB();

const clientesRouter = require('./routes/clientes');
const productosRouter = require('./routes/productos');
const facturasRouter = require('./routes/facturas');

app.use('/api/clientes', clientesRouter);
app.use('/api/productos', productosRouter);
app.use('/api/facturas', facturasRouter);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
