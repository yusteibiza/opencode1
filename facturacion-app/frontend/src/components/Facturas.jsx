import { useState, useEffect } from 'react';
import { facturasAPI, clientesAPI, productosAPI } from '../services/api';
import { jsPDF } from 'jspdf';
import { formatMoneda, formatFecha } from '../services/utils';

function Facturas() {
    const [facturas, setFacturas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

    const [formData, setFormData] = useState({
        numero: '',
        cliente_id: '',
        fecha: new Date().toISOString().split('T')[0],
        items: []
    });

    const [itemActual, setItemActual] = useState({
        producto_id: '',
        cantidad: 1,
        precio_unitario: 0
    });

    useEffect(() => {
        fetchFacturas();
        fetchClientes();
        fetchProductos();
    }, []);

    const fetchFacturas = async () => {
        try {
            const response = await facturasAPI.getAll();
            setFacturas(response.data.facturas);
        } catch (error) {
            console.error('Error fetching facturas:', error);
        }
    };

    const fetchClientes = async () => {
        try {
            const response = await clientesAPI.getAll();
            setClientes(response.data.clientes);
        } catch (error) {
            console.error('Error fetching clientes:', error);
        }
    };

    const fetchProductos = async () => {
        try {
            const response = await productosAPI.getAll();
            setProductos(response.data.productos);
        } catch (error) {
            console.error('Error fetching productos:', error);
        }
    };

    const handleProductoChange = (e) => {
        const productoId = parseInt(e.target.value);
        const producto = productos.find(p => p.id === productoId);
        setItemActual({
            producto_id: productoId,
            cantidad: 1,
            precio_unitario: producto ? producto.precio : 0
        });
    };

    const agregarItem = () => {
        if (!itemActual.producto_id) return;

        const subtotal = itemActual.cantidad * itemActual.precio_unitario;
        const nuevoItem = {
            ...itemActual,
            subtotal
        };

        setFormData({
            ...formData,
            items: [...formData.items, nuevoItem]
        });

        setItemActual({
            producto_id: '',
            cantidad: 1,
            precio_unitario: 0
        });
    };

    const eliminarItem = (index) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index)
        });
    };

    const calcularTotales = () => {
        const subtotal = formData.items.reduce((sum, item) => sum + item.subtotal, 0);
        const iva = subtotal * 0.21;
        const total = subtotal + iva;
        return { subtotal, iva, total };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.items.length === 0) {
            alert('Debe agregar al menos un item a la factura');
            return;
        }

        const { subtotal, iva, total } = calcularTotales();
        
        try {
            await facturasAPI.create({
                ...formData,
                subtotal,
                iva,
                total
            });
            fetchFacturas();
            resetForm();
        } catch (error) {
            console.error('Error creating factura:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar esta factura?')) {
            try {
                await facturasAPI.delete(id);
                fetchFacturas();
            } catch (error) {
                console.error('Error deleting factura:', error);
            }
        }
    };

    const verFactura = async (id) => {
        try {
            const response = await facturasAPI.getById(id);
            setFacturaSeleccionada(response.data.factura);
        } catch (error) {
            console.error('Error fetching factura:', error);
        }
    };

    const generarPDF = () => {
        if (!facturaSeleccionada) return;

        const doc = new jsPDF();
        const cliente = clientes.find(c => c.id === facturaSeleccionada.cliente_id);

        doc.setFontSize(20);
        doc.text('FACTURA', 105, 20, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`Número: ${facturaSeleccionada.numero}`, 20, 40);
        doc.text(`Fecha: ${formatFecha(facturaSeleccionada.fecha)}`, 20, 50);
        doc.text(`Cliente: ${cliente ? cliente.nombre : 'N/A'}`, 20, 60);

        if (cliente) {
            doc.setFontSize(10);
            doc.text(`Email: ${cliente.email || 'N/A'}`, 20, 68);
            doc.text(`Teléfono: ${cliente.telefono || 'N/A'}`, 20, 75);
            doc.text(`Dirección: ${cliente.direccion || 'N/A'}`, 20, 82);
        }

        let y = 100;
        doc.setFontSize(12);

        doc.text('Descripción', 20, y);
        doc.text('Cantidad', 100, y);
        doc.text('Precio Unit.', 130, y);
        doc.text('Subtotal', 160, y);

        y += 10;
        doc.line(20, y, 190, y);
        y += 10;

        facturaSeleccionada.items.forEach((item, index) => {
            doc.setFontSize(10);
            doc.text(item.producto_nombre || 'Producto', 20, y);
            doc.text(item.cantidad.toString(), 100, y);
            doc.text(formatMoneda(item.precio_unitario), 130, y);
            doc.text(formatMoneda(item.subtotal), 160, y);
            y += 10;
        });

        y += 10;
        doc.line(20, y, 190, y);
        y += 10;

        doc.setFontSize(12);
        doc.text(`Subtotal: ${formatMoneda(facturaSeleccionada.subtotal)}`, 140, y);
        y += 10;
        doc.text(`IVA (21%): ${formatMoneda(facturaSeleccionada.iva)}`, 140, y);
        y += 10;
        doc.setFontSize(14);
        doc.text(`Total: ${formatMoneda(facturaSeleccionada.total)}`, 140, y);

        doc.save(`factura_${facturaSeleccionada.numero}.pdf`);
    };

    const resetForm = () => {
        setFormData({
            numero: '',
            cliente_id: '',
            fecha: new Date().toISOString().split('T')[0],
            items: []
        });
        setShowForm(false);
    };

    return (
        <div className="container">
            <h1>Gestión de Facturas</h1>
            <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                {showForm ? 'Cancelar' : 'Nueva Factura'}
            </button>

            {showForm && (
                <form className="form" onSubmit={handleSubmit}>
                    <h2>Nueva Factura</h2>
                    <input
                        type="text"
                        placeholder="Número de Factura *"
                        value={formData.numero}
                        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                        required
                    />
                    <select
                        value={formData.cliente_id}
                        onChange={(e) => setFormData({ ...formData, cliente_id: parseInt(e.target.value) })}
                        required
                    >
                        <option value="">Seleccionar Cliente *</option>
                        {clientes.map((cliente) => (
                            <option key={cliente.id} value={cliente.id}>
                                {cliente.nombre}
                            </option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={formData.fecha}
                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                        required
                    />

                    <h3>Agregar Item</h3>
                    <select
                        value={itemActual.producto_id}
                        onChange={handleProductoChange}
                    >
                        <option value="">Seleccionar Producto</option>
                        {productos.map((producto) => (
                            <option key={producto.id} value={producto.id}>
                                {producto.codigo} - {producto.nombre} - {formatMoneda(producto.precio)}
                            </option>
                        ))}
                    </select>
                    <input
                        type="number"
                        min="1"
                        placeholder="Cantidad"
                        value={itemActual.cantidad}
                        onChange={(e) => setItemActual({ ...itemActual, cantidad: parseInt(e.target.value) })}
                    />
                    <input
                        type="number"
                        step="0.01"
                        placeholder="Precio Unitario"
                        value={itemActual.precio_unitario}
                        onChange={(e) => setItemActual({ ...itemActual, precio_unitario: parseFloat(e.target.value) })}
                    />
                    <button type="button" className="btn btn-secondary" onClick={agregarItem}>
                        Agregar Item
                    </button>

                    <table className="table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Cantidad</th>
                                <th>Precio Unitario</th>
                                <th>Subtotal</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.items.map((item, index) => {
                                const producto = productos.find(p => p.id === item.producto_id);
                        return (
                            <tr key={factura.id}>
                                <td>{factura.id}</td>
                                <td>{factura.numero}</td>
                                <td>{factura.cliente_nombre}</td>
                                <td>{formatFecha(factura.fecha)}</td>
                                <td>{formatMoneda(factura.total)}</td>
                                <td>{factura.estado}</td>
                            <td>
                                <button className="btn btn-info" onClick={() => verFactura(factura.id)}>
                                    Ver
                                </button>
                                <button className="btn btn-warning" onClick={() => generarPDF()}>
                                    PDF
                                </button>
                                <button className="btn btn-danger" onClick={() => handleDelete(factura.id)}>
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {facturaSeleccionada && (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Factura #{facturaSeleccionada.numero}</h2>
                        <p><strong>Cliente:</strong> {facturaSeleccionada.cliente_nombre}</p>
                        <p><strong>Fecha:</strong> {formatFecha(facturaSeleccionada.fecha)}</p>
                        <p><strong>Email:</strong> {facturaSeleccionada.cliente_email || 'N/A'}</p>
                        <p><strong>Teléfono:</strong> {facturaSeleccionada.cliente_telefono || 'N/A'}</p>
                        <p><strong>Dirección:</strong> {facturaSeleccionada.cliente_direccion || 'N/A'}</p>

                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Cantidad</th>
                                    <th>Precio Unitario</th>
                                    <th>Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                {facturaSeleccionada.items.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.producto_nombre}</td>
                                        <td>{item.cantidad}</td>
                                        <td>{formatMoneda(item.precio_unitario)}</td>
                                        <td>{formatMoneda(item.subtotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="totales">
                            <p><strong>Subtotal:</strong> {formatMoneda(facturaSeleccionada.subtotal)}</p>
                            <p><strong>IVA (21%):</strong> {formatMoneda(facturaSeleccionada.iva)}</p>
                            <p><strong>Total:</strong> {formatMoneda(facturaSeleccionada.total)}</p>
                        </div>

                        <button className="btn btn-success" onClick={generarPDF}>
                            Descargar PDF
                        </button>
                        <button className="btn btn-secondary" onClick={() => setFacturaSeleccionada(null)}>
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Facturas;
