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
    const { numero, cliente_id, fecha, subtotal, iva, total, items } = req.body;

    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
            'INSERT INTO facturas (numero, cliente_id, fecha, subtotal, iva, total) VALUES (?, ?, ?, ?, ?, ?)',
            [numero, cliente_id, fecha, subtotal, iva, total],
            function(err) {
                if (err) {
                    db.run('ROLLBACK');
                    res.status(500).json({ error: err.message });
                    return;
                }

                const facturaId = this.lastID;

                const itemPromises = items.map(item => {
                    return new Promise((resolve, reject) => {
                        db.run(
                            'INSERT INTO factura_items (factura_id, producto_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
                            [facturaId, item.producto_id, item.cantidad, item.precio_unitario, item.subtotal],
                            function(err) {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    });
                });

                Promise.all(itemPromises)
                    .then(() => {
                        db.run('COMMIT');
                        res.status(201).json({ 
                            factura: { 
                                id: facturaId, 
                                numero, cliente_id, fecha, subtotal, iva, total 
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
