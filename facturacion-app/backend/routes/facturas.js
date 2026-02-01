const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
    const sql = `
        SELECT f.*, c.nombre as cliente_nombre 
        FROM facturas f 
        LEFT JOIN clientes c ON f.cliente_id = c.id 
        ORDER BY f.id DESC
    `;
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ facturas: rows });
    });
});

router.get('/:id', (req, res) => {
    const sql = `
        SELECT f.*, c.nombre as cliente_nombre, c.email as cliente_email, 
               c.telefono as cliente_telefono, c.direccion as cliente_direccion
        FROM facturas f 
        LEFT JOIN clientes c ON f.cliente_id = c.id 
        WHERE f.id = ?
    `;
    
    db.get(sql, [req.params.id], (err, factura) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!factura) {
            res.status(404).json({ error: 'Factura no encontrada' });
            return;
        }

        const itemsSql = `
            SELECT fi.*, p.nombre as producto_nombre, p.codigo as producto_codigo
            FROM factura_items fi
            LEFT JOIN productos p ON fi.producto_id = p.id
            WHERE fi.factura_id = ?
        `;

        db.all(itemsSql, [req.params.id], (err, items) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ factura: { ...factura, items } });
        });
    });
});

router.post('/', (req, res) => {
    const { numero, cliente_id, fecha, items } = req.body;

    // Validar stock disponible antes de crear la factura
    const stockChecks = items.map(item => {
        return new Promise((resolve, reject) => {
            db.get('SELECT stock, nombre FROM productos WHERE id = ?', [item.producto_id], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (!row) {
                    reject(new Error(`Producto con ID ${item.producto_id} no encontrado`));
                    return;
                }
                if (row.stock < item.cantidad) {
                    reject(new Error(`Stock insuficiente para el producto "${row.nombre}". Disponible: ${row.stock}, Solicitado: ${item.cantidad}`));
                    return;
                }
                resolve();
            });
        });
    });

    Promise.all(stockChecks)
        .then(() => {
            db.serialize(() => {
                db.run('BEGIN TRANSACTION');

                // Calcular totales basados en los items
                let subtotalFactura = 0;
                let ivaFactura = 0;
                let totalFactura = 0;

                items.forEach(item => {
                    const subtotalLinea = item.cantidad * item.precio_unitario;
                    const ivaLinea = subtotalLinea * (item.iva_porcentaje / 100);
                    const totalLinea = subtotalLinea + ivaLinea;
                    
                    subtotalFactura += subtotalLinea;
                    ivaFactura += ivaLinea;
                    totalFactura += totalLinea;
                });

                db.run(
                    'INSERT INTO facturas (numero, cliente_id, fecha, subtotal, iva, total) VALUES (?, ?, ?, ?, ?, ?)',
                    [numero, cliente_id, fecha, subtotalFactura, ivaFactura, totalFactura],
                    function(err) {
                        if (err) {
                            db.run('ROLLBACK');
                            res.status(500).json({ error: err.message });
                            return;
                        }

                        const facturaId = this.lastID;

                        const itemPromises = items.map(item => {
                            return new Promise((resolve, reject) => {
                                const subtotalLinea = item.cantidad * item.precio_unitario;
                                const ivaLinea = subtotalLinea * (item.iva_porcentaje / 100);
                                const totalLinea = subtotalLinea + ivaLinea;

                                db.run(
                                    'INSERT INTO factura_items (factura_id, producto_id, cantidad, precio_unitario, iva_porcentaje, subtotal, iva_linea, total_linea) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                                    [facturaId, item.producto_id, item.cantidad, item.precio_unitario, item.iva_porcentaje, subtotalLinea, ivaLinea, totalLinea],
                                    function(err) {
                                        if (err) reject(err);
                                        else resolve();
                                    }
                                );
                            });
                        });

                        Promise.all(itemPromises)
                            .then(() => {
                                // Actualizar stock de productos
                                const stockPromises = items.map(item => {
                                    return new Promise((resolve, reject) => {
                                        db.run(
                                            'UPDATE productos SET stock = stock - ? WHERE id = ?',
                                            [item.cantidad, item.producto_id],
                                            function(err) {
                                                if (err) reject(err);
                                                else resolve();
                                            }
                                        );
                                    });
                                });
                                return Promise.all(stockPromises);
                            })
                            .then(() => {
                                db.run('COMMIT');
                                res.status(201).json({ 
                                    factura: { 
                                        id: facturaId, 
                                        numero, cliente_id, fecha, subtotal: subtotalFactura, iva: ivaFactura, total: totalFactura 
                                    } 
                                });
                            })
                            .catch(err => {
                                db.run('ROLLBACK');
                                res.status(500).json({ error: err.message });
                            });
                    }
                );
            });
        })
        .catch(err => {
            res.status(400).json({ error: err.message });
        });
});

// Endpoint para marcar factura como pagada - DEBE IR ANTES de /:id
router.put('/:id/pagar', (req, res) => {
    db.run(
        "UPDATE facturas SET estado = 'pagada' WHERE id = ? AND estado = 'pendiente'",
        [req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(400).json({ 
                    error: 'Factura no encontrada o ya está pagada',
                    code: 'ALREADY_PAID'
                });
                return;
            }
            res.json({ message: 'Factura marcada como pagada' });
        }
    );
});

router.put('/:id', (req, res) => {
    const { numero, cliente_id, fecha, subtotal, iva, total, estado } = req.body;

    db.run(
        'UPDATE facturas SET numero = ?, cliente_id = ?, fecha = ?, subtotal = ?, iva = ?, total = ?, estado = ? WHERE id = ?',
        [numero, cliente_id, fecha, subtotal, iva, total, estado, req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Factura no encontrada' });
                return;
            }
            res.json({ message: 'Factura actualizada' });
        }
    );
});

router.delete('/:id', (req, res) => {
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run('DELETE FROM factura_items WHERE factura_id = ?', [req.params.id], (err) => {
            if (err) {
                db.run('ROLLBACK');
                res.status(500).json({ error: err.message });
                return;
            }

            db.run('DELETE FROM facturas WHERE id = ?', [req.params.id], function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                }
                if (this.changes === 0) {
                    db.run('ROLLBACK');
                    res.status(404).json({ error: 'Factura no encontrada' });
                    return;
                }
                db.run('COMMIT');
                res.json({ message: 'Factura eliminada' });
            });
        });
    });
});

module.exports = router;
