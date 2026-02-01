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
    const { codigo, nombre, descripcion, precio, stock } = req.body;
    db.run(
        'INSERT INTO productos (codigo, nombre, descripcion, precio, stock) VALUES (?, ?, ?, ?, ?)',
        [codigo, nombre, descripcion, precio, stock],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ 
                producto: { 
                    id: this.lastID, 
                    codigo, nombre, descripcion, precio, stock 
                } 
            });
        }
    );
});

router.put('/:id', (req, res) => {
    const { codigo, nombre, descripcion, precio, stock } = req.body;
    db.run(
        'UPDATE productos SET codigo = ?, nombre = ?, descripcion = ?, precio = ?, stock = ? WHERE id = ?',
        [codigo, nombre, descripcion, precio, stock, req.params.id],
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
});

module.exports = router;
