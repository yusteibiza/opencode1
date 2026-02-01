const express = require('express');
const router = express.Router();
const { db } = require('../database');

router.get('/', (req, res) => {
    db.all('SELECT * FROM clientes ORDER BY id DESC', [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ clientes: rows });
    });
});

router.get('/:id', (req, res) => {
    db.get('SELECT * FROM clientes WHERE id = ?', [req.params.id], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Cliente no encontrado' });
            return;
        }
        res.json({ cliente: row });
    });
});

router.post('/', (req, res) => {
    const { nombre, email, telefono, direccion } = req.body;
    db.run(
        'INSERT INTO clientes (nombre, email, telefono, direccion) VALUES (?, ?, ?, ?)',
        [nombre, email, telefono, direccion],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.status(201).json({ 
                cliente: { 
                    id: this.lastID, 
                    nombre, email, telefono, direccion 
                } 
            });
        }
    );
});

router.put('/:id', (req, res) => {
    const { nombre, email, telefono, direccion } = req.body;
    db.run(
        'UPDATE clientes SET nombre = ?, email = ?, telefono = ?, direccion = ? WHERE id = ?',
        [nombre, email, telefono, direccion, req.params.id],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Cliente no encontrado' });
                return;
            }
            res.json({ message: 'Cliente actualizado' });
        }
    );
});

router.delete('/:id', (req, res) => {
    db.run('DELETE FROM clientes WHERE id = ?', [req.params.id], function(err) {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Cliente no encontrado' });
            return;
        }
        res.json({ message: 'Cliente eliminado' });
    });
});

module.exports = router;
