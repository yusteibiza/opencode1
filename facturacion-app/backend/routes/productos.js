const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
    db.all('SELECT * FROM productos ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ productos: rows });
    });
});

router.get('/:id', (req, res) => {
    db.get('SELECT * FROM productos WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Producto no encontrado' });
            return;
        }
        res.json({ producto: row });
    });
});

router.post('/', (req, res) => {
    const { codigo, nombre, descripcion, precio, stock, iva_porcentaje } = req.body;
    const iva = iva_porcentaje || 21.0;
    db.run(
        'INSERT INTO productos (codigo, nombre, descripcion, precio, stock, iva_porcentaje) VALUES (?, ?, ?, ?, ?, ?)',
        [codigo, nombre, descripcion, precio, stock, iva],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ 
                producto: { 
                    id: this.lastID, 
                    codigo, nombre, descripcion, precio, stock, iva_porcentaje: iva
                } 
            });
        }
    );
});

router.put('/:id', (req, res) => {
    const { codigo, nombre, descripcion, precio, stock, iva_porcentaje } = req.body;
    db.run(
        'UPDATE productos SET codigo = ?, nombre = ?, descripcion = ?, precio = ?, stock = ?, iva_porcentaje = ? WHERE id = ?',
        [codigo, nombre, descripcion, precio, stock, iva_porcentaje || 21.0, req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Producto no encontrado' });
                return;
            }
            res.json({ message: 'Producto actualizado' });
        }
    );
});

router.delete('/:id', (req, res) => {
    // Primero verificar si el producto está en alguna factura
    db.get(
        `SELECT COUNT(*) as count FROM factura_items WHERE producto_id = ?`,
        [req.params.id],
        (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            
            if (row.count > 0) {
                res.status(400).json({ 
                    error: 'No se puede eliminar este producto porque está siendo utilizado en facturas existentes',
                    code: 'PRODUCT_IN_USE'
                });
                return;
            }
            
            // Si no está en uso, proceder a eliminar
            db.run('DELETE FROM productos WHERE id = ?', [req.params.id], function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                if (this.changes === 0) {
                    res.status(404).json({ error: 'Producto no encontrado' });
                    return;
                }
                res.json({ message: 'Producto eliminado' });
            });
        }
    );
});

module.exports = router;
