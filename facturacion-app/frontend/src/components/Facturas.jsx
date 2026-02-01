import { useState, useEffect } from 'react';
import { facturasAPI, clientesAPI, productosAPI } from '../services/api';
import { jsPDF } from 'jspdf';
import { formatMoneda, formatFecha } from '../services/utils';
import { AlertModal, useAlertModal } from './AlertModal';

function Facturas() {
    const [facturas, setFacturas] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);

    const { showAlert, modalState, handleConfirm, handleCancel } = useAlertModal();

    const [formData, setFormData] = useState({
        numero: '',
        cliente_id: '',
        fecha: new Date().toISOString().split('T')[0],
        items: []
    });

    const [itemActual, setItemActual] = useState({
        producto_id: '',
        cantidad: 1,
        precio_unitario: 0,
        iva_porcentaje: 21
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
            precio_unitario: producto ? producto.precio : 0,
            iva_porcentaje: producto && producto.iva_porcentaje ? producto.iva_porcentaje : 21
        });
    };

    const agregarItem = () => {
        if (!itemActual.producto_id) return;
        
        const cantidad = itemActual.cantidad;
        const precio_unitario = itemActual.precio_unitario;
        const iva_porcentaje = itemActual.iva_porcentaje;
        
        const subtotal = cantidad * precio_unitario;
        const iva_linea = subtotal * (iva_porcentaje / 100);
        const total_linea = subtotal + iva_linea;
        
        const nuevoItem = { 
            ...itemActual, 
            subtotal, 
            iva_linea, 
            total_linea, 
            iva_porcentaje 
        };
        
        setFormData({ ...formData, items: [...formData.items, nuevoItem] });
        setItemActual({ producto_id: '', cantidad: 1, precio_unitario: 0, iva_porcentaje: 21 });
    };

    const eliminarItem = (index) => {
        setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });
    };

    const calcularTotales = () => {
        const items = formData.items;
        const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
        const iva = items.reduce((sum, item) => sum + item.iva_linea, 0);
        const total = items.reduce((sum, item) => sum + item.total_linea, 0);
        
        // Calculate IVA breakdown by percentage
        const ivaBreakdown = {};
        items.forEach(item => {
            const pct = item.iva_porcentaje;
            if (!ivaBreakdown[pct]) {
                ivaBreakdown[pct] = 0;
            }
            ivaBreakdown[pct] += item.iva_linea;
        });
        
        return { subtotal, iva, total, ivaBreakdown };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.items.length === 0) {
            showAlert({
                title: 'Factura incompleta',
                message: 'Debe agregar al menos un producto a la factura',
                type: 'warning',
                showCancel: false,
                confirmText: 'OK'
            });
            return;
        }
        const { subtotal, iva, total } = calcularTotales();
        try {
            await facturasAPI.create({ ...formData, subtotal, iva, total });
            fetchFacturas();
            resetForm();
        } catch (error) {
            console.error('Error creating factura:', error);
        }
    };

    const handleDelete = (id) => {
        const factura = facturas.find(f => f.id === id);
        showAlert({
            title: '¿Eliminar factura?',
            message: `¿Está seguro de eliminar la factura #${factura?.numero || id}?`,
            type: 'danger',
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                try {
                    await facturasAPI.delete(id);
                    fetchFacturas();
                } catch (error) {
                    console.error('Error deleting factura:', error);
                }
            }
        });
    };

    const handlePagar = (id) => {
        const factura = facturas.find(f => f.id === id);
        showAlert({
            title: '¿Marcar como pagada?',
            message: `¿Está seguro de marcar como pagada la factura #${factura?.numero || id}?`,
            type: 'warning',
            confirmText: 'Confirmar',
            cancelText: 'Cancelar',
            onConfirm: async () => {
                try {
                    await facturasAPI.pagar(id);
                    fetchFacturas();
                } catch (error) {
                    console.error('Error completo:', error);
                    let errorMsg = 'Error al pagar la factura';
                    
                    if (error.response) {
                        // El servidor respondió con un código de error
                        errorMsg = error.response.data?.error || 
                                  error.response.data?.message || 
                                  `Error ${error.response.status}: ${error.response.statusText}`;
                    } else if (error.request) {
                        // La petición se hizo pero no hubo respuesta
                        errorMsg = 'No se pudo conectar con el servidor';
                    } else {
                        // Error al configurar la petición
                        errorMsg = error.message || 'Error desconocido';
                    }
                    
                    showAlert({
                        title: 'Error',
                        message: errorMsg,
                        type: 'warning',
                        showCancel: false,
                        confirmText: 'OK'
                    });
                }
            }
        });
    };

    const verFactura = async (id) => {
        try {
            const response = await facturasAPI.getById(id);
            setFacturaSeleccionada(response.data.factura);
        } catch (error) {
            console.error('Error fetching factura:', error);
        }
    };

    const generarPDF = (factura) => {
        const facturaData = factura || facturaSeleccionada;
        if (!facturaData) return;
        
        const cliente = clientes.find(c => c.id === facturaData.cliente_id);
        const items = facturaData.items || [];
        
        // Calculate IVA breakdown for PDF
        const ivaBreakdown = {};
        items.forEach(item => {
            const pct = item.iva_porcentaje || 21;
            if (!ivaBreakdown[pct]) {
                ivaBreakdown[pct] = 0;
            }
            ivaBreakdown[pct] += (item.iva_linea || 0);
        });
        
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text('FACTURA', 105, 20, { align: 'center' });
        doc.setFontSize(12);
        doc.text(`Número: ${facturaData.numero}`, 20, 40);
        doc.text(`Fecha: ${formatFecha(facturaData.fecha)}`, 20, 50);
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
        doc.text('Cant.', 70, y);
        doc.text('P.Unit', 95, y);
        doc.text('Subtotal', 125, y);
        doc.text('IVA %', 155, y);
        doc.text('IVA', 175, y);
        doc.text('Total', 190, y);
        y += 10;
        doc.line(20, y, 200, y);
        y += 10;
        
        doc.setFontSize(9);
        items.forEach((item) => {
            const subtotal = item.subtotal || (item.cantidad * item.precio_unitario);
            const ivaPct = item.iva_porcentaje || 21;
            const ivaLinea = item.iva_linea || (subtotal * (ivaPct / 100));
            const totalLinea = item.total_linea || (subtotal + ivaLinea);
            
            doc.text(item.producto_nombre || 'Producto', 20, y);
            doc.text(item.cantidad.toString(), 70, y);
            doc.text(formatMoneda(item.precio_unitario), 95, y);
            doc.text(formatMoneda(subtotal), 125, y);
            doc.text(`${ivaPct}%`, 155, y);
            doc.text(formatMoneda(ivaLinea), 175, y);
            doc.text(formatMoneda(totalLinea), 190, y);
            y += 8;
        });
        
        y += 5;
        doc.line(20, y, 200, y);
        y += 10;
        
        doc.setFontSize(10);
        doc.text(`Subtotal: ${formatMoneda(facturaData.subtotal)}`, 140, y);
        y += 7;
        
        // Show IVA breakdown
        Object.entries(ivaBreakdown).forEach(([pct, amount]) => {
            doc.text(`IVA (${pct}%): ${formatMoneda(amount)}`, 140, y);
            y += 7;
        });
        
        y += 3;
        doc.setFontSize(14);
        doc.text(`TOTAL: ${formatMoneda(facturaData.total)}`, 140, y);
        doc.save(`factura_${facturaData.numero}.pdf`);
    };

    const imprimirFactura = (factura) => {
        const facturaData = factura || facturaSeleccionada;
        if (!facturaData) return;
        
        const printWindow = window.open('', '_blank');
        const cliente = clientes.find(c => c.id === facturaData.cliente_id);
        const items = facturaData.items || [];
        
        // Calculate IVA breakdown
        const ivaBreakdown = {};
        items.forEach(item => {
            const pct = item.iva_porcentaje || 21;
            if (!ivaBreakdown[pct]) {
                ivaBreakdown[pct] = 0;
            }
            ivaBreakdown[pct] += (item.iva_linea || 0);
        });
        
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Factura ${facturaData.numero}</title>
                <style>
                    body { 
                        font-family: 'Segoe UI', Arial, sans-serif; 
                        margin: 40px; 
                        color: #333;
                        background: white;
                    }
                    .header { 
                        text-align: center; 
                        border-bottom: 2px solid ${isDark ? '#a855f7' : '#0078d4'}; 
                        padding-bottom: 20px; 
                        margin-bottom: 30px; 
                    }
                    .header h1 { 
                        color: ${isDark ? '#a855f7' : '#0078d4'}; 
                        margin: 0; 
                        font-size: 28px;
                    }
                    .info { 
                        margin-bottom: 30px; 
                    }
                    .info-row { 
                        margin: 8px 0; 
                        font-size: 14px;
                    }
                    .info-label { 
                        font-weight: 600; 
                        display: inline-block; 
                        width: 100px; 
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 20px 0;
                        font-size: 12px;
                    }
                    th { 
                        background: ${isDark ? '#a855f7' : '#0078d4'}; 
                        color: white; 
                        padding: 10px; 
                        text-align: left; 
                        font-weight: 600;
                    }
                    td { 
                        padding: 8px 10px; 
                        border-bottom: 1px solid #e1dfdd; 
                    }
                    tr:hover { 
                        background: #f3f2f1; 
                    }
                    .totals { 
                        margin-top: 20px; 
                        text-align: right; 
                        border-top: 2px solid ${isDark ? '#a855f7' : '#0078d4'}; 
                        padding-top: 20px; 
                    }
                    .total-row { 
                        margin: 8px 0; 
                        font-size: 14px;
                    }
                    .total-row.final { 
                        font-size: 18px; 
                        font-weight: 700; 
                        color: ${isDark ? '#a855f7' : '#0078d4'}; 
                        margin-top: 15px;
                    }
                    @media print {
                        body { margin: 20px; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>FACTURA</h1>
                    <div style="font-size: 24px; margin-top: 10px;">#${facturaData.numero}</div>
                </div>
                
                <div class="info">
                    <div class="info-row">
                        <span class="info-label">Fecha:</span>
                        ${formatFecha(facturaData.fecha)}
                    </div>
                    <div class="info-row">
                        <span class="info-label">Cliente:</span>
                        ${cliente ? cliente.nombre : 'N/A'}
                    </div>
                    ${cliente ? `
                        <div class="info-row">
                            <span class="info-label">Email:</span>
                            ${cliente.email || 'N/A'}
                        </div>
                        <div class="info-row">
                            <span class="info-label">Teléfono:</span>
                            ${cliente.telefono || 'N/A'}
                        </div>
                    ` : ''}
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th style="text-align: center;">Cant.</th>
                            <th style="text-align: right;">P. Unit</th>
                            <th style="text-align: right;">Subtotal</th>
                            <th style="text-align: center;">IVA %</th>
                            <th style="text-align: right;">IVA</th>
                            <th style="text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => {
                            const subtotal = item.subtotal || (item.cantidad * item.precio_unitario);
                            const ivaPct = item.iva_porcentaje || 21;
                            const ivaLinea = item.iva_linea || (subtotal * (ivaPct / 100));
                            const totalLinea = item.total_linea || (subtotal + ivaLinea);
                            return `
                                <tr>
                                    <td>${item.producto_nombre || 'Producto'}</td>
                                    <td style="text-align: center;">${item.cantidad}</td>
                                    <td style="text-align: right;">${formatMoneda(item.precio_unitario)}</td>
                                    <td style="text-align: right;">${formatMoneda(subtotal)}</td>
                                    <td style="text-align: center;">${ivaPct}%</td>
                                    <td style="text-align: right;">${formatMoneda(ivaLinea)}</td>
                                    <td style="text-align: right; font-weight: 600;">${formatMoneda(totalLinea)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                
                <div class="totals">
                    <div class="total-row">
                        <span style="font-weight: 600;">Subtotal:</span>
                        <span style="margin-left: 20px;">${formatMoneda(facturaData.subtotal)}</span>
                    </div>
                    ${Object.entries(ivaBreakdown).map(([pct, amount]) => `
                        <div class="total-row">
                            <span style="font-weight: 600;">IVA (${pct}%):</span>
                            <span style="margin-left: 20px;">${formatMoneda(amount)}</span>
                        </div>
                    `).join('')}
                    <div class="total-row final">
                        <span>TOTAL:</span>
                        <span style="margin-left: 20px;">${formatMoneda(facturaData.total)}</span>
                    </div>
                </div>
                
                <div class="no-print" style="margin-top: 40px; text-align: center;">
                    <button onclick="window.print()" style="
                        padding: 12px 24px;
                        font-size: 16px;
                        background: ${isDark ? '#a855f7' : '#0078d4'};
                        color: white;
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    ">🖨️ Imprimir</button>
                </div>
            </body>
            </html>
        `;
        
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const resetForm = () => {
        setFormData({ numero: '', cliente_id: '', fecha: new Date().toISOString().split('T')[0], items: [] });
        setItemActual({ producto_id: '', cantidad: 1, precio_unitario: 0, iva_porcentaje: 21 });
        setShowForm(false);
    };

    const { subtotal, iva, total, ivaBreakdown } = calcularTotales();

    const getEstadoBadge = (estado) => {
        switch(estado) {
            case 'pagada': return <span className="badge badge-success">Pagada</span>;
            case 'pendiente': return <span className="badge badge-warning">Pendiente</span>;
            default: return <span className="badge badge-ghost">{estado}</span>;
        }
    };

    // Calculate IVA breakdown for selected invoice modal
    const calcularIvaBreakdownFactura = (factura) => {
        if (!factura || !factura.items) return {};
        const breakdown = {};
        factura.items.forEach(item => {
            const pct = item.iva_porcentaje || 21;
            if (!breakdown[pct]) {
                breakdown[pct] = 0;
            }
            breakdown[pct] += (item.iva_linea || 0);
        });
        return breakdown;
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Facturas</h1>
                    <p className="page-subtitle">Gestiona tus facturas y transacciones</p>
                </div>
                <div className="page-actions">
                    <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                        {showForm ? 'Cancelar' : '+ Nueva Factura'}
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="form-section" style={{ marginBottom: '1.5rem' }}>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group" style={{ maxWidth: '200px' }}>
                                <label className="form-label">Número *</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="F-001"
                                    value={formData.numero}
                                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Cliente *</label>
                                <select
                                    className="form-select"
                                    value={formData.cliente_id}
                                    onChange={(e) => setFormData({ ...formData, cliente_id: parseInt(e.target.value) })}
                                    required
                                >
                                    <option value="">Seleccionar cliente</option>
                                    {clientes.map((cliente) => (
                                        <option key={cliente.id} value={cliente.id}>{cliente.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ maxWidth: '180px' }}>
                                <label className="form-label">Fecha *</label>
                                <input
                                    type="date"
                                    className="form-input"
                                    value={formData.fecha}
                                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <h3 className="form-title" style={{ marginTop: '1.5rem', fontSize: '1rem' }}>Agregar Productos</h3>
                        <div className="form-row">
                            <div className="form-group" style={{ flex: 2 }}>
                                <label className="form-label">Producto</label>
                                <select
                                    className="form-select"
                                    value={itemActual.producto_id}
                                    onChange={handleProductoChange}
                                >
                                    <option value="">Seleccionar producto</option>
                                    {productos.map((producto) => (
                                        <option key={producto.id} value={producto.id}>
                                            {producto.nombre} - {formatMoneda(producto.precio)} (IVA {producto.iva_porcentaje || 21}%)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ maxWidth: '100px' }}>
                                <label className="form-label">Cantidad</label>
                                <input
                                    type="number"
                                    min="1"
                                    className="form-input"
                                    value={itemActual.cantidad}
                                    onChange={(e) => setItemActual({ ...itemActual, cantidad: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="form-group" style={{ maxWidth: '130px' }}>
                                <label className="form-label">P. Unit.</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="form-input"
                                    value={itemActual.precio_unitario}
                                    onChange={(e) => setItemActual({ ...itemActual, precio_unitario: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="form-group" style={{ maxWidth: '100px' }}>
                                <label className="form-label">IVA %</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="form-input"
                                    value={itemActual.iva_porcentaje}
                                    onChange={(e) => setItemActual({ ...itemActual, iva_porcentaje: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={agregarItem}>
                                    + Agregar
                                </button>
                            </div>
                        </div>

                        {formData.items.length > 0 && (
                            <div className="card" style={{ margin: '1.5rem 0' }}>
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th style={{ textAlign: 'center' }}>Cant.</th>
                                            <th style={{ textAlign: 'right' }}>P. Unit</th>
                                            <th style={{ textAlign: 'right' }}>Subtotal</th>
                                            <th style={{ textAlign: 'center' }}>IVA %</th>
                                            <th style={{ textAlign: 'right' }}>IVA</th>
                                            <th style={{ textAlign: 'right' }}>Total</th>
                                            <th style={{ textAlign: 'center' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.items.map((item, index) => {
                                            const producto = productos.find(p => p.id === item.producto_id);
                                            return (
                                                <tr key={index}>
                                                    <td>{producto ? producto.nombre : 'Producto'}</td>
                                                    <td style={{ textAlign: 'center' }}>{item.cantidad}</td>
                                                    <td style={{ textAlign: 'right' }}>{formatMoneda(item.precio_unitario)}</td>
                                                    <td style={{ textAlign: 'right' }}>{formatMoneda(item.subtotal)}</td>
                                                    <td style={{ textAlign: 'center' }}>{item.iva_porcentaje}%</td>
                                                    <td style={{ textAlign: 'right' }}>{formatMoneda(item.iva_linea)}</td>
                                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoneda(item.total_linea)}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button type="button" className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => eliminarItem(index)}>
                                                            ✕
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>

                                <div className="totales">
                                    <div className="totales-row">
                                        <span>Subtotal (sin IVA)</span>
                                        <span>{formatMoneda(subtotal)}</span>
                                    </div>
                                    
                                    {/* IVA Breakdown by percentage */}
                                    {Object.entries(ivaBreakdown).map(([pct, amount]) => (
                                        <div key={pct} className="totales-row" style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                                            <span>IVA {pct}%</span>
                                            <span>{formatMoneda(amount)}</span>
                                        </div>
                                    ))}
                                    
                                    <div className="totales-row" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                                        <span>Total IVA</span>
                                        <span>{formatMoneda(iva)}</span>
                                    </div>
                                    
                                    <div className="totales-row" style={{ fontSize: '1.2em', fontWeight: 700, color: 'var(--primary)' }}>
                                        <span>TOTAL</span>
                                        <span>{formatMoneda(total)}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-success">
                                Guardar Factura
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Número</th>
                            <th>Cliente</th>
                            <th>Fecha</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                            <th style={{ textAlign: 'center' }}>Estado</th>
                            <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {facturas.length === 0 ? (
                            <tr>
                                <td colSpan="6">
                                    <div className="empty-state">
                                        <div className="empty-state-icon">📄</div>
                                        <div className="empty-state-title">No hay facturas</div>
                                        <div>Crea tu primera factura para comenzar</div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            facturas.map((factura) => (
                                <tr key={factura.id}>
                                    <td>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--primary)' }}>
                                            #{factura.numero}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{factura.cliente_nombre}</td>
                                    <td>{formatFecha(factura.fecha)}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatMoneda(factura.total)}</td>
                                    <td style={{ textAlign: 'center' }}>{getEstadoBadge(factura.estado)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <button className="btn btn-sm btn-ghost" onClick={() => verFactura(factura.id)}>
                                            👁️ Ver
                                        </button>
                                        <button className="btn btn-sm btn-ghost" onClick={() => generarPDF(factura)}>
                                            📥 PDF
                                        </button>
                                        <button className="btn btn-sm btn-ghost" onClick={() => imprimirFactura(factura)}>
                                            🖨️ Imprimir
                                        </button>
                                        {factura.estado === 'pendiente' && (
                                            <button className="btn btn-sm btn-success" onClick={() => handlePagar(factura.id)}>
                                                💳 Pagar
                                            </button>
                                        )}
                                        <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(factura.id)}>
                                            🗑️
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {facturaSeleccionada && (
                <div className="modal-overlay" onClick={() => setFacturaSeleccionada(null)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Factura #{facturaSeleccionada.numero}</h2>
                            <button className="btn btn-ghost" onClick={() => setFacturaSeleccionada(null)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="card" style={{ marginBottom: '1.5rem' }}>
                                <p><strong>Cliente:</strong> {facturaSeleccionada.cliente_nombre}</p>
                                <p><strong>Fecha:</strong> {formatFecha(facturaSeleccionada.fecha)}</p>
                                <p><strong>Email:</strong> {facturaSeleccionada.cliente_email || 'N/A'}</p>
                                <p><strong>Teléfono:</strong> {facturaSeleccionada.cliente_telefono || 'N/A'}</p>
                            </div>

                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th style={{ textAlign: 'center' }}>Cant.</th>
                                        <th style={{ textAlign: 'right' }}>P. Unit</th>
                                        <th style={{ textAlign: 'right' }}>Subtotal</th>
                                        <th style={{ textAlign: 'center' }}>IVA %</th>
                                        <th style={{ textAlign: 'right' }}>IVA</th>
                                        <th style={{ textAlign: 'right' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {facturaSeleccionada.items.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.producto_nombre}</td>
                                            <td style={{ textAlign: 'center' }}>{item.cantidad}</td>
                                            <td style={{ textAlign: 'right' }}>{formatMoneda(item.precio_unitario)}</td>
                                            <td style={{ textAlign: 'right' }}>{formatMoneda(item.subtotal || (item.cantidad * item.precio_unitario))}</td>
                                            <td style={{ textAlign: 'center' }}>{item.iva_porcentaje || 21}%</td>
                                            <td style={{ textAlign: 'right' }}>{formatMoneda(item.iva_linea || ((item.subtotal || (item.cantidad * item.precio_unitario)) * ((item.iva_porcentaje || 21) / 100)))}</td>
                                            <td style={{ textAlign: 'right', fontWeight: 500 }}>{formatMoneda(item.total_linea || ((item.subtotal || (item.cantidad * item.precio_unitario)) * (1 + (item.iva_porcentaje || 21) / 100)))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="totales">
                                <div className="totales-row">
                                    <span>Subtotal (sin IVA)</span>
                                    <span>{formatMoneda(facturaSeleccionada.subtotal)}</span>
                                </div>
                                
                                {/* IVA Breakdown for modal */}
                                {Object.entries(calcularIvaBreakdownFactura(facturaSeleccionada)).map(([pct, amount]) => (
                                    <div key={pct} className="totales-row" style={{ fontSize: '0.9em', color: 'var(--text-muted)' }}>
                                        <span>IVA {pct}%</span>
                                        <span>{formatMoneda(amount)}</span>
                                    </div>
                                ))}
                                
                                <div className="totales-row" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                                    <span>Total IVA</span>
                                    <span>{formatMoneda(facturaSeleccionada.iva)}</span>
                                </div>
                                
                                <div className="totales-row" style={{ fontSize: '1.2em', fontWeight: 700, color: 'var(--primary)' }}>
                                    <span>TOTAL</span>
                                    <span>{formatMoneda(facturaSeleccionada.total)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setFacturaSeleccionada(null)}>
                                Cerrar
                            </button>
                            <button className="btn btn-success" onClick={() => generarPDF()}>
                                📥 Descargar PDF
                            </button>
                            <button className="btn btn-primary" onClick={() => imprimirFactura(facturaSeleccionada)}>
                                🖨️ Imprimir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <AlertModal
                isOpen={modalState.isOpen}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
                confirmText={modalState.confirmText}
                cancelText={modalState.cancelText}
                showCancel={modalState.showCancel}
            />
        </div>
    );
}

export default Facturas;
